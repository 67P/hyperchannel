import { modifier } from 'ember-modifier';

/**
 * Sets up DOM observation for a chat scroll container.
 *
 * Observes both the scroll container and its content wrapper with a
 * `ResizeObserver` (so content growth/reflow is detected even when the
 * container itself doesn't change size), and forwards scroll and `scrollend`
 * events. All scroll policy lives in the component; this modifier only wires
 * up and tears down observers/listeners.
 */
export default modifier((element, _positional, { onReady, onScroll, onScrollEnd, onContentResize }) => {
  onReady?.(element);

  // Observe the content wrapper, not the scroll container itself: the container
  // resizes when a scrollbar appears/disappears, which would otherwise cause a
  // resize/scroll feedback loop. Window resizes are handled separately.
  const content = element.firstElementChild ?? element;

  const resizeObserver = new ResizeObserver(() => onContentResize?.());
  resizeObserver.observe(content);

  const windowResizeHandler = () => onContentResize?.();
  window.addEventListener('resize', windowResizeHandler);

  const scrollHandler = (event) => onScroll?.(event);
  element.addEventListener('scroll', scrollHandler, { passive: true });

  const scrollEndHandler = () => onScrollEnd?.();
  element.addEventListener('scrollend', scrollEndHandler);

  return () => {
    resizeObserver.disconnect();
    window.removeEventListener('resize', windowResizeHandler);
    element.removeEventListener('scroll', scrollHandler);
    element.removeEventListener('scrollend', scrollEndHandler);
  };
}, { eager: false });
