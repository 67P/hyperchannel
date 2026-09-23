import { modifier } from 'ember-modifier';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

function focusableElements (element) {
  return Array.from(element.querySelectorAll(FOCUSABLE_SELECTOR));
}

/**
 * Moves focus into a newly inserted dialog, keeps Tab navigation contained
 * within it, closes it on Escape, and restores focus to the previously active
 * element when the dialog is removed.
 */
export default modifier((element, [onClose]) => {
  const previouslyFocused = document.activeElement;

  if (!element.hasAttribute('tabindex')) {
    element.setAttribute('tabindex', '-1');
  }

  element.focus({ preventScroll: true });

  function handleKeydown (event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose?.();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusable = focusableElements(element);
    if (focusable.length === 0) {
      event.preventDefault();
      element.focus({ preventScroll: true });
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && (document.activeElement === first || document.activeElement === element)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  element.addEventListener('keydown', handleKeydown);

  return () => {
    element.removeEventListener('keydown', handleKeydown);
    previouslyFocused?.focus?.({ preventScroll: true });
  };
});
