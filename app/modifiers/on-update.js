import { modifier } from 'ember-modifier';

export default modifier((element, [callback]) => {
  const handler = () => {
    const value = element.type === 'checkbox' ? element.checked : element.value;
    callback(value);
  };

  const eventType = element.type === 'checkbox' ? 'change' : 'input';
  element.addEventListener(eventType, handler);

  return () => {
    element.removeEventListener(eventType, handler);
  };
});
