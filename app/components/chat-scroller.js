import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { registerDestructor } from '@ember/destroyable';
import { buildWaiter } from '@ember/test-waiters';
import {
  ScrollAction,
  createScrollState,
  reduceScrollState,
  isNearTop,
} from 'hyperchannel/utils/chat-scroll-state';

const MAINTENANCE_TIMEOUT = 150; // ms
// Safety net for the user-initiated smooth scroll to the bottom: it keeps the
// maintenance lock while animating, so this only fires if frames stop (e.g. a
// backgrounded tab) or the animation makes no progress.
const SMOOTH_SCROLL_TIMEOUT = 4000; // ms
// Reference frame length and per-frame remainder fraction for the
// scroll-to-bottom animation. The fraction is normalized by the actual frame
// time, so the motion feels the same on 60Hz and 120Hz displays.
const SMOOTH_SCROLL_FRAME_MS = 1000 / 60;
const SMOOTH_SCROLL_DECAY_PER_FRAME = 0.78;
const FILL_MAX_NO_PROGRESS = 2;

// Tracks the component's deferred async work (maintenance timer, frame
// callbacks) so `settled()` can synchronize deterministically in tests.
const scrollerWaiter = buildWaiter('chat-scroller');

function itemKey (item) {
  if (!item) return '';
  return item.key ?? item.id ?? '';
}

function escapeAttributeValue (value) {
  const stringValue = String(value ?? '');
  if (typeof CSS !== 'undefined' && CSS.escape) {
    return CSS.escape(stringValue);
  }
  return stringValue.replace(/["\\]/g, '\\$&');
}

/**
 * Scroll container for a chat message list.
 *
 * Owns all scroll behavior for the channel: sticking to the bottom, detaching
 * when the user scrolls up, restoring the visual position when older messages
 * are revealed/loaded, and triggering automatic history loading near the top.
 *
 * Auto-loading is level-triggered and single-flight (near the top, or filling
 * a short list), with a separate no-progress guard. All programmatic position
 * changes happen under a maintenance lock so they are never mistaken for user
 * intent (which caused feedback loops in the past). Layout corrections are
 * applied synchronously with the DOM update so the viewport never jumps.
 *
 * The decision making lives in `hyperchannel/utils/chat-scroll-state`; this
 * component is the DOM adapter that applies the resulting effects.
 *
 * Yields a small API to the surrounding template:
 *   scroll.isAtBottom, scroll.newMessageCount, scroll.showJumpToLatest, scroll.scrollToBottom
 */
export default class ChatScrollerComponent extends Component {
  @tracked isAtBottom = true;
  @tracked newMessageCount = 0;
  @tracked showJumpToLatest = false;

  scrollState = createScrollState();
  scrollElement = null;
  itemKeys = null;

  // Programmatic scroll maintenance lock (does not trigger reactive updates).
  maintainingScroll = false;
  maintenanceTimer = null;
  maintenanceTarget = null;
  maintenanceObservedTop = 0;
  maintenanceWaiterToken = null;
  smoothAnimationFrame = null;
  smoothScrollAnimating = false;
  smoothScrollRequested = false;

  // Auto-load bookkeeping.
  olderRequestPending = false;
  fillNoProgress = 0;
  lastFillHeight = 0;
  resizeScheduled = false;

  constructor () {
    super(...arguments);
    registerDestructor(this, () => {
      if (this.maintenanceTimer) {
        clearTimeout(this.maintenanceTimer);
        this.maintenanceTimer = null;
      }
      if (this.smoothAnimationFrame) {
        cancelAnimationFrame(this.smoothAnimationFrame);
        this.smoothAnimationFrame = null;
      }
      this.endMaintenanceWaiter();
    });
  }

  // Runs `callback` on the next frame, tracked by a test waiter so `settled()`
  // can synchronize deterministically instead of tests relying on sleeps.
  runInFrame (callback) {
    const token = scrollerWaiter.beginAsync();
    requestAnimationFrame(() => {
      try {
        callback();
      } finally {
        scrollerWaiter.endAsync(token);
      }
    });
  }

  endMaintenanceWaiter () {
    if (this.maintenanceWaiterToken) {
      scrollerWaiter.endAsync(this.maintenanceWaiterToken);
      this.maintenanceWaiterToken = null;
    }
  }

  get scrollApi () {
    return {
      isAtBottom: this.isAtBottom,
      newMessageCount: this.newMessageCount,
      showJumpToLatest: this.showJumpToLatest,
      scrollToBottom: this.scrollToBottom,
    };
  }

  getContentElement () {
    return this.scrollElement?.firstElementChild ?? null;
  }

  metricsFrom (element) {
    if (!element) return { scrollTop: 0, scrollHeight: 0, clientHeight: 0 };
    return {
      scrollTop: element.scrollTop,
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
    };
  }

  metrics () {
    return this.metricsFrom(this.scrollElement);
  }

  contentFits (metrics = this.metrics()) {
    return metrics.clientHeight > 0 && metrics.scrollHeight <= metrics.clientHeight + 1;
  }

  reduceAndApply (event) {
    const { state, effects } = reduceScrollState(this.scrollState, event);
    this.scrollState = state;
    this.syncTrackedState();
    this.applyEffects(effects);
  }

  // Modifier callbacks (`on-change`) run during the render transaction, so we
  // defer state changes and DOM effects to the next frame. Setting tracked
  // state during render would invalidate and re-run the modifier recursively.
  scheduleReduce (event) {
    this.runInFrame(() => {
      if (this.isDestroyed || this.isDestroying) return;
      this.reduceAndApply(event);
    });
  }

  syncTrackedState () {
    const { atBottom, newMessageCount, showJumpToLatest } = this.scrollState;
    if (this.isAtBottom !== atBottom) this.isAtBottom = atBottom;
    if (this.newMessageCount !== newMessageCount) this.newMessageCount = newMessageCount;
    if (this.showJumpToLatest !== showJumpToLatest) this.showJumpToLatest = showJumpToLatest;
  }

  applyEffects (effects) {
    for (const effect of effects) {
      switch (effect) {
        case ScrollAction.ScrollToBottom:
          this.applyScrollToBottom();
          break;
        case ScrollAction.CaptureAnchor:
          this.captureAnchor();
          break;
        case ScrollAction.RestoreAnchor:
          this.restoreAnchor();
          break;
        case ScrollAction.LoadOlder:
          this.args.onLoadOlder?.();
          break;
      }
    }
  }

  // --- Programmatic scroll maintenance --------------------------------------

  beginMaintenance (timeout = MAINTENANCE_TIMEOUT) {
    if (this.maintenanceTimer) {
      clearTimeout(this.maintenanceTimer);
    }
    this.endMaintenanceWaiter();
    this.maintenanceWaiterToken = scrollerWaiter.beginAsync();
    this.maintainingScroll = true;
    this.maintenanceObservedTop = this.scrollElement?.scrollTop ?? 0;
    this.maintenanceTimer = setTimeout(() => {
      this.maintenanceTimer = null;
      if (this.isDestroyed || this.isDestroying) return;
      this.endMaintenance();
    }, timeout);
  }

  endMaintenance () {
    if (this.maintenanceTimer) {
      clearTimeout(this.maintenanceTimer);
      this.maintenanceTimer = null;
    }
    if (this.smoothAnimationFrame) {
      cancelAnimationFrame(this.smoothAnimationFrame);
      this.smoothAnimationFrame = null;
    }
    this.endMaintenanceWaiter();
    const wasMaintaining = this.maintainingScroll;
    this.maintainingScroll = false;
    this.maintenanceTarget = null;
    this.smoothScrollAnimating = false;

    // Transition to "at bottom" only once a programmatic scroll has finished.
    // Doing it earlier removes the jump button mid-animation, and its removal
    // resizes the observed content wrapper, whose correction would turn a smooth
    // scroll into an instant jump.
    if (wasMaintaining && this.scrollState.stickToBottom) {
      this.reduceAndApply({ type: 'scroll-settled' });
    }
  }

  prefersReducedMotion () {
    return typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  applyScrollToBottom () {
    const element = this.scrollElement;
    if (!element) return;

    const smooth = this.smoothScrollRequested && !this.prefersReducedMotion();
    this.smoothScrollRequested = false;

    if (smooth) {
      this.startSmoothScrollToBottom(element);
      return;
    }

    // A smooth scroll is already heading to the bottom; don't override it.
    if (this.smoothScrollAnimating) return;

    this.beginMaintenance();
    // Clamp to the real maximum: assigning past it can itself trigger an
    // overscroll on some engines.
    element.scrollTop = element.scrollHeight - element.clientHeight;
    this.maintenanceTarget = element.scrollTop;
    // For an instant scroll the position is already at the target, so any
    // deviating scroll event means the user interrupted: treat it as such
    // immediately instead of waiting for the maintenance timeout.
    this.maintenanceObservedTop = element.scrollTop;
  }

  // Drives the user-initiated scroll-to-bottom ourselves rather than using the
  // browser's `scrollTo({ behavior: 'smooth' })`. Setting `scrollTop` directly
  // each frame never overshoots and leaves native overscroll for user scrolls
  // untouched.
  //
  // The motion is a time-normalized exponential decay: the first frame(s) are
  // capped so starting from far away doesn't lurch, then it decays as a long,
  // monotonic ease-out (a symmetric ease-in-out compresses the deceleration
  // into the end of its timeline and lands abruptly).
  startSmoothScrollToBottom (element) {
    this.smoothScrollAnimating = true;
    this.animateScrollToBottom(element);
  }

  animateScrollToBottom (element) {
    const start = element.scrollTop;
    const end = element.scrollHeight - element.clientHeight;
    const distance = end - start;

    if (distance <= 1) {
      // Already there: settle immediately.
      this.beginMaintenance();
      element.scrollTop = end;
      this.maintenanceTarget = element.scrollTop;
      this.maintenanceObservedTop = element.scrollTop;
      this.endMaintenance();
      return;
    }

    // Maximum distance moved in a single reference frame, scaled with the
    // distance but bounded so the start never reads as a jump.
    const stepCap = Math.max(24, Math.min(96, distance * 0.05));

    // Safety net in case animation frames stop (e.g. a backgrounded tab).
    this.beginMaintenance(SMOOTH_SCROLL_TIMEOUT);
    // Seed the target synchronously: a scroll event queued from a previous
    // programmatic scroll can arrive before the first animation frame, and
    // `handleScroll` ends maintenance immediately when the target is null.
    this.maintenanceTarget = end;
    this.maintenanceObservedTop = start;

    let lastTime = performance.now();

    const step = (now) => {
      this.smoothAnimationFrame = null;
      if (this.isDestroyed || this.isDestroying || !this.maintainingScroll) return;

      // If content changed mid-animation (a history page landed), restart from
      // the current position so the moving target can't jump or land short.
      if (Math.abs((element.scrollHeight - element.clientHeight) - end) > 1) {
        this.animateScrollToBottom(element);
        return;
      }

      const dt = Math.min(100, now - lastTime);
      lastTime = now;

      const remaining = end - element.scrollTop;
      if (remaining <= 1) {
        element.scrollTop = end;
        this.endMaintenance();
        return;
      }

      // Fraction of the remaining distance per reference frame, normalized by
      // the actual frame time so the feel is display-refresh independent. The
      // absolute cap keeps a delayed frame from jumping.
      const frameScale = dt / SMOOTH_SCROLL_FRAME_MS;
      const decay = 1 - Math.pow(SMOOTH_SCROLL_DECAY_PER_FRAME, frameScale);
      const delta = Math.min(remaining * decay, stepCap);
      // Always advance by at least one device pixel: the exponential would
      // otherwise asymptote a couple of pixels short and never finish.
      element.scrollTop += Math.max(1, Math.min(delta, remaining));
      this.maintenanceObservedTop = element.scrollTop;

      this.smoothAnimationFrame = requestAnimationFrame(step);
    };

    this.smoothAnimationFrame = requestAnimationFrame(step);
  }

  // --- Anchoring ------------------------------------------------------------

  captureAnchor () {
    const element = this.scrollElement;
    const content = this.getContentElement();
    if (!element || !content) return;

    const containerTop = element.getBoundingClientRect().top;
    const nodes = content.querySelectorAll('[data-message-key]');

    for (const node of nodes) {
      const rect = node.getBoundingClientRect();
      if (rect.bottom > containerTop) {
        this.scrollState = {
          ...this.scrollState,
          anchor: { key: node.dataset.messageKey, offset: rect.top - containerTop },
        };
        return;
      }
    }

    this.scrollState = { ...this.scrollState, anchor: null };
  }

  restoreAnchor () {
    // A smooth scroll to the bottom is in progress; don't fight it.
    if (this.smoothScrollAnimating) return;

    const anchor = this.scrollState.anchor;
    const element = this.scrollElement;
    const content = this.getContentElement();
    if (!anchor || !element || !content) return;

    const node = content.querySelector(
      `[data-message-key="${escapeAttributeValue(anchor.key)}"]`
    );
    if (!node) return;

    const containerTop = element.getBoundingClientRect().top;
    const rect = node.getBoundingClientRect();
    const delta = (rect.top - containerTop) - anchor.offset;
    if (Math.abs(delta) <= 1) return; // tolerate sub-pixel/fractional scroll values

    this.beginMaintenance();
    const maxTop = element.scrollHeight - element.clientHeight;
    element.scrollTop = Math.min(maxTop, element.scrollTop + delta);
    this.maintenanceTarget = element.scrollTop;
    // Instant scroll: see applyScrollToBottom.
    this.maintenanceObservedTop = element.scrollTop;
  }

  // --- Auto-loading ---------------------------------------------------------

  /**
   * Genuine user scroll: update stickiness and request older messages when the
   * user is near the top.
   */
  handleUserScroll (metrics) {
    this.reduceAndApply({ type: 'user-scroll', metrics });
    this.requestOlderIfNeeded();
  }

  /**
   * Requests the next page of older messages when appropriate.
   *
   * Level-triggered (not a one-shot edge) but single-flight via
   * `olderRequestPending`, so it can be safely re-checked after a load
   * completes, on resize, and on scroll end. This ensures that reaching the top
   * while a page is already loading still loads the next page once the current
   * one finishes, instead of requiring the user to scroll down and back up.
   */
  requestOlderIfNeeded () {
    if (this.isDestroyed || this.isDestroying) return;
    if (this.args.isLoadingOlder || !this.args.hasOlder) return;
    if (this.olderRequestPending) return;

    const metrics = this.metrics();
    if (metrics.clientHeight === 0) return;

    const nearTop = isNearTop(metrics);
    const fits = this.contentFits(metrics);
    if (!nearTop && !fits) return;

    if (fits) {
      // Fill the viewport: keep loading while the content is shorter than the
      // window, but stop if loading makes no progress.
      if (metrics.scrollHeight === this.lastFillHeight) {
        this.fillNoProgress += 1;
      } else {
        this.fillNoProgress = 0;
        this.lastFillHeight = metrics.scrollHeight;
      }
      if (this.fillNoProgress > FILL_MAX_NO_PROGRESS) return;
    } else if (this.scrollState.stickToBottom) {
      // Pinned to the bottom of a long list: this is not history reading.
      return;
    }

    this.olderRequestPending = true;
    this.reduceAndApply({ type: 'reached-top', hasOlder: true, isLoadingOlder: false });
  }

  // --- DOM event handlers ---------------------------------------------------

  @action
  handleReady (element) {
    this.scrollElement = element;
  }

  @action
  handleReset () {
    this.endMaintenance();
    this.olderRequestPending = false;
    this.fillNoProgress = 0;
    this.lastFillHeight = 0;
    this.scheduleReduce({ type: 'reset' });
  }

  @action
  handleItemsChanged (items) {
    // Content changed, so the previous request has been satisfied.
    this.olderRequestPending = false;

    const keys = (items ?? []).map(itemKey);
    const previousKeys = this.itemKeys;
    this.itemKeys = keys;

    if (!previousKeys) return; // initial render; reset handled separately

    const previousSet = new Set(previousKeys);
    const firstKey = keys[0];
    const lastKey = keys[keys.length - 1];

    // Detect both ends independently: a live message can arrive at the same time
    // as a history page, and the prepend must still be handled.
    const prepended = firstKey !== undefined && !previousSet.has(firstKey);
    const appended = lastKey !== undefined && !previousSet.has(lastKey);

    if (prepended) {
      // `older-prepended` only restores the scroll position (no tracked writes),
      // so apply it synchronously. Doing this in the same turn as the DOM update
      // (before paint) prevents a visible jump and stops a concurrent user
      // scroll from capturing a shifted anchor.
      this.reduceAndApply({ type: 'older-prepended' });
    }

    if (appended) {
      let count = 0;
      for (let i = keys.length - 1; i >= 0 && !previousSet.has(keys[i]); i--) {
        if (items?.[i]?.type !== 'date-headline') count += 1;
      }
      if (this.scrollState.stickToBottom) {
        // The sticky branch only scrolls to the bottom (no tracked writes).
        this.reduceAndApply({ type: 'content-appended', count });
      } else {
        // Detached: this updates newMessageCount/showJumpToLatest (tracked), so
        // defer it to avoid writing tracked state during render.
        this.scheduleReduce({ type: 'content-appended', count });
      }
    }

    if (!prepended && !appended) {
      // No tracked writes either; apply synchronously for the same reason.
      this.reduceAndApply({ type: 'content-resized' });
    }
  }

  @action
  handleScroll (event) {
    const metrics = this.metricsFrom(event.currentTarget);

    if (this.maintainingScroll) {
      const target = this.maintenanceTarget;

      if (target === null) {
        this.endMaintenance();
      } else {
        const distance = Math.abs(metrics.scrollTop - target);
        const previousDistance = Math.abs(this.maintenanceObservedTop - target);
        const reachedTarget = distance <= 1;
        // Moving away from the target means the user interrupted (e.g. scrolled
        // up mid-animation); everything else is our own scroll in progress.
        const movingAway = distance > previousDistance;

        this.maintenanceObservedTop = metrics.scrollTop;

        if (!reachedTarget && !movingAway) {
          return;
        }

        this.endMaintenance();
        if (reachedTarget) return;
        // Otherwise fall through and treat it as a user scroll.
      }
    }

    this.handleUserScroll(metrics);
  }

  @action
  handleScrollEnd () {
    // Our own animation sets `scrollTop` each frame, so the browser fires
    // `scrollend` between frames. Ignore those; the animation ends itself.
    if (this.smoothScrollAnimating) return;
    // Do not re-apply scroll here: re-correcting from scrollend caused runaway
    // feedback loops. Layout corrections are driven by ResizeObserver instead.
    this.endMaintenance();
    // Coalesced scroll events can skip the exact position where the top zone was
    // entered, so re-check here as well.
    this.requestOlderIfNeeded();
  }

  @action
  handleContentResize () {
    // ResizeObserver callbacks run after layout but before paint, so applying
    // the layout correction here keeps the scroll position stable without a
    // one-frame jump. `content-resized` performs no tracked writes (it only
    // adjusts scrollTop), and setting scrollTop does not resize the observed
    // element, so this is safe inside the callback.
    this.reduceAndApply({ type: 'content-resized' });

    // Defer the auto-load request: it can add content, which must not happen
    // inside the ResizeObserver callback (that causes the "ResizeObserver loop
    // completed with undelivered notifications" error).
    if (this.resizeScheduled) return;
    this.resizeScheduled = true;

    this.runInFrame(() => {
      this.resizeScheduled = false;
      if (this.isDestroyed || this.isDestroying) return;
      this.requestOlderIfNeeded();
    });
  }

  @action
  handleLoadingOlderChanged (isLoading) {
    if (isLoading) return;

    // The in-flight page finished; allow requesting the next one if we are
    // still near the top (e.g. the user reached the top while it was loading).
    this.olderRequestPending = false;
    this.runInFrame(() => {
      if (this.isDestroyed || this.isDestroying) return;
      this.requestOlderIfNeeded();
    });
  }

  @action
  scrollToBottom () {
    // Once we settle at the bottom the jump button is removed from the DOM, so
    // move focus into the message list first, otherwise keyboard/screen-reader
    // focus would be dropped to <body>. `preventScroll` keeps this from
    // fighting the animation that follows.
    this.scrollElement?.focus({ preventScroll: true });
    // Request a smooth scroll only for this explicit, user-initiated action.
    this.smoothScrollRequested = true;
    this.reduceAndApply({ type: 'scroll-to-bottom' });
    this.smoothScrollRequested = false;
  }
}
