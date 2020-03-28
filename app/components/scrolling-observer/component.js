import Component from '@glimmer/component';
import { scheduleOnce } from '@ember/runloop';
import { action, observer } from '@ember/object';

export default class ScrollingObserverComponent extends Component {

  observer = null;
  element = null;

  get enabled () {
    if (typeof this.args.enabled === 'undefined') {
      return true;
    } else {
      return this.args.enabled;
    }
  }

  get retriggeringEnabled () {
    if (typeof this.args.retriggeringEnabled === 'undefined') {
      return true;
    } else {
      return this.args.retriggeringEnabled;
    }
  }

  get rootMargin () {
    return this.args.rootMargin || '0px';
  }

  get threshold () {
    return this.args.threshold || 0;
  }

  @action
  createObserver (element) {
    scheduleOnce('afterRender', this, this.createIntersectionObserver, element);
  }

  @action
  disconnectObserver () {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  retriggerObservation (observer, target) {
    observer.unobserve(target);
    observer.observe(target);
  }

  createIntersectionObserver (element) {
    let rootElement = this.args.rootElement;
    if (typeof rootElement === 'string') {
      rootElement = document.querySelector(rootElement);
    }

    const config = {
      root: rootElement,
      rootMargin: this.rootMargin,
      threshold: this.threshold
    };

    let observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (this.args.onIntersect) {
            this.args.onIntersect();
          }
          if (this.enabled && this.retriggeringEnabled) {
            scheduleOnce('afterRender', this, 'retriggerObservation', observer, entry.target);
          }
        } else {
          if (this.onDiverge) {
            this.onDiverge();
          }
        }
      });
    }, config);

    observer.observe(element);

    this.observer = observer;
    this.element = element;
  }

  rootMarginChanged = observer('rootMargin', function () {
    if (this.enabled && this.observer) {
      this.observer.disconnect();
      this.createIntersectionObserver();
    }
  });

  enabledChanged = observer('enabled', function () {
    if (this.enabled) {
      this.observer.observe(this.element);
    } else {
      this.observer.disconnect();
    }
  });

}
