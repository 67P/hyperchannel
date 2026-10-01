import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import {
  ScrollAction,
  createScrollState,
  reduceScrollState,
  isNearTop,
} from 'hyperchannel/utils/chat-scroll-state';

const MAINTENANCE_TIMEOUT = 150; // ms
const SMOOTH_SCROLL_TIMEOUT = 1000; // ms; upper bound for a smooth scroll
const FILL_MAX_NO_PROGRESS = 2;

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
  smoothScrollRequested = false;

  // Auto-load bookkeeping.
  olderRequestPending = false;
  fillNoProgress = 0;
  lastFillHeight = 0;
  resizeScheduled = false;

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
    requestAnimationFrame(() => {
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
    this.maintainingScroll = true;
    this.maintenanceObservedTop = this.scrollElement?.scrollTop ?? 0;
    this.maintenanceTimer = setTimeout(() => {
      this.maintenanceTimer = null;
      this.endMaintenance();
    }, timeout);
  }

  endMaintenance () {
    if (this.maintenanceTimer) {
      clearTimeout(this.maintenanceTimer);
      this.maintenanceTimer = null;
    }
    this.maintainingScroll = false;
    this.maintenanceTarget = null;
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

    const maxTop = element.scrollHeight - element.clientHeight;

    if (smooth) {
      this.beginMaintenance(SMOOTH_SCROLL_TIMEOUT);
      element.scrollTo({ top: maxTop, behavior: 'smooth' });
      this.maintenanceTarget = maxTop;
    } else {
      this.beginMaintenance();
      element.scrollTop = element.scrollHeight;
      this.maintenanceTarget = element.scrollTop;
    }
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
    element.scrollTop += delta;
    this.maintenanceTarget = element.scrollTop;
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
        count += 1;
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

    requestAnimationFrame(() => {
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
    requestAnimationFrame(() => {
      if (this.isDestroyed || this.isDestroying) return;
      this.requestOlderIfNeeded();
    });
  }

  @action
  scrollToBottom () {
    // Request a smooth scroll only for this explicit, user-initiated action.
    this.smoothScrollRequested = true;
    this.reduceAndApply({ type: 'scroll-to-bottom' });
    this.smoothScrollRequested = false;
  }
}
