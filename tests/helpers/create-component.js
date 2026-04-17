import { getContext } from '@ember/test-helpers';

export default function createComponent (lookupPath, options = {}) {
  let { owner } = getContext();
  let { class: componentClass } = owner.factoryFor(lookupPath);
  return new componentClass(owner, options.args || {});
}
