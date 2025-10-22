import { modifier } from 'ember-modifier';

export default modifier((element, _, { onIntersect, onDiverge, enabled = true, retriggeringEnabled = true, rootElement, rootMargin = '0px', threshold = 0 }) => {
  let root = rootElement;
  if (typeof root === 'string') {
    root = document.querySelector(root);
  }

  const config = {
    root,
    rootMargin,
    threshold
  };

  const retriggerObservation = (observer, target) => {
    observer.unobserve(target);
    observer.observe(target);
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (onIntersect) {
          onIntersect();
        }
        if (enabled && retriggeringEnabled) {
          requestAnimationFrame(() => retriggerObservation(obs, entry.target));
        }
      } else {
        if (onDiverge) {
          onDiverge();
        }
      }
    });
  }, config);

  if (enabled) {
    observer.observe(element);
  }

  return () => {
    observer.disconnect();
  };
}, { eager: false });
