import { getContext } from '@ember/test-helpers';
import GlimmerComponentManager from '../../component-managers/glimmer';

export default function createComponent(lookupPath, named = {}) {
  let { owner } = getContext();
  let { class: componentClass } = owner.factoryFor(lookupPath);
  let componentManager = new GlimmerComponentManager(owner);
  return componentManager.createComponent(componentClass, { named });
}
