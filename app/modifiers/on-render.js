import { modifier } from 'ember-modifier';

export default modifier((element, [onRender]) => {
  // Schedule the callback to run after render using requestAnimationFrame
  requestAnimationFrame(() => {
    onRender(element);
  });

  return () => {};
});
