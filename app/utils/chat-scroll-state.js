/**
 * Pure scroll policy for chat message lists.
 *
 * This module contains no DOM access: given the current state and an event it
 * returns the next state plus a list of effects for the DOM adapter
 * (`ChatScrollerComponent`) to apply. Keeping the policy pure makes the tricky
 * parts (stickiness, anchoring, history loading) straightforward to unit test.
 */

export const AT_BOTTOM_THRESHOLD = 50; // px
export const AT_TOP_THRESHOLD = 200; // px

export const ScrollAction = Object.freeze({
  ScrollToBottom: 'ScrollToBottom',
  CaptureAnchor: 'CaptureAnchor',
  RestoreAnchor: 'RestoreAnchor',
  LoadOlder: 'LoadOlder',
});

export function isAtBottom (
  { scrollTop, scrollHeight, clientHeight },
  threshold = AT_BOTTOM_THRESHOLD
) {
  // When the content fits entirely, we are always at the bottom.
  if (scrollHeight <= clientHeight) return true;
  // Use a small margin so fractional/DPI-related scroll values don't cause flicker.
  return scrollHeight - scrollTop - clientHeight <= threshold;
}

export function isNearTop (
  { scrollTop, scrollHeight, clientHeight },
  threshold = AT_TOP_THRESHOLD
) {
  // Only meaningful when there is actually something to scroll. This prevents
  // short channels without a scrollbar from auto-loading their entire history.
  if (scrollHeight <= clientHeight) return false;
  return scrollTop <= threshold;
}

export function createScrollState () {
  return {
    atBottom: true,
    stickToBottom: true,
    anchor: null,
    programmaticScroll: false,
    newMessageCount: 0,
    showJumpToLatest: false,
  };
}

/**
 * @param {object} state current scroll state (see createScrollState)
 * @param {object} event one of:
 *   { type: 'reset' }
 *   { type: 'scroll-to-bottom' }
 *   { type: 'scroll-settled' }
 *   { type: 'programmatic-scroll-started' }
 *   { type: 'programmatic-scroll-ended' }
 *   { type: 'user-scroll', metrics }
 *   { type: 'content-appended', count }
 *   { type: 'content-resized' }
 *   { type: 'older-prepended' }
 *   { type: 'reached-top', hasOlder, isLoadingOlder }
 * @returns {{ state: object, effects: string[] }}
 */
export function reduceScrollState (state, event) {
  switch (event.type) {
    case 'reset':
      // TODO: When read status is cached/persisted, scroll to the first unread
      // message instead of the bottom (see issue #285 and the unread divider plan).
      return {
        state: createScrollState(),
        effects: [ScrollAction.ScrollToBottom],
      };

    case 'scroll-to-bottom':
      // Don't mark `atBottom` yet: the jump button lives inside the observed
      // content wrapper, so removing it immediately would resize the wrapper and
      // trigger a non-smooth correction that cancels a smooth scroll. Settle it
      // in `scroll-settled` once the scroll has finished.
      return {
        state: {
          ...state,
          stickToBottom: true,
          newMessageCount: 0,
          showJumpToLatest: false,
        },
        effects: [ScrollAction.ScrollToBottom],
      };

    case 'scroll-settled':
      if (!state.stickToBottom) {
        return { state, effects: [] };
      }
      return { state: { ...state, atBottom: true }, effects: [] };

    case 'programmatic-scroll-started':
      return { state: { ...state, programmaticScroll: true }, effects: [] };

    case 'programmatic-scroll-ended':
      return { state: { ...state, programmaticScroll: false }, effects: [] };

    case 'user-scroll': {
      if (isAtBottom(event.metrics)) {
        return {
          state: {
            ...state,
            atBottom: true,
            stickToBottom: true,
            newMessageCount: 0,
            showJumpToLatest: false,
          },
          effects: [],
        };
      }
      return {
        state: { ...state, atBottom: false, stickToBottom: false },
        effects: [ScrollAction.CaptureAnchor],
      };
    }

    case 'content-appended': {
      if (state.stickToBottom) {
        return { state, effects: [ScrollAction.ScrollToBottom] };
      }
      const newMessageCount = state.newMessageCount + Math.max(1, event.count ?? 1);
      return {
        state: { ...state, newMessageCount, showJumpToLatest: true },
        effects: [],
      };
    }

    case 'content-resized': {
      if (state.stickToBottom) {
        return { state, effects: [ScrollAction.ScrollToBottom] };
      }
      return { state, effects: [ScrollAction.RestoreAnchor] };
    }

    case 'older-prepended':
      return { state, effects: [ScrollAction.RestoreAnchor] };

    case 'reached-top': {
      if (!event.hasOlder || event.isLoadingOlder) {
        return { state, effects: [] };
      }
      // While sticking to the bottom (e.g. filling a short history), don't
      // anchor: the new page should keep the newest message in view. When the
      // user is reading history, capture the anchor so their position is kept
      // while older messages are revealed/loaded above.
      const effects = state.stickToBottom
        ? [ScrollAction.LoadOlder]
        : [ScrollAction.CaptureAnchor, ScrollAction.LoadOlder];
      return { state, effects };
    }

    default:
      return { state, effects: [] };
  }
}
