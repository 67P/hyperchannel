import Component from '@ember/component';
import { scheduleOnce } from '@ember/runloop';
import { observer } from '@ember/object';

export default Component.extend({

  rootElement: null,
  rootMargin: '100px',
  threshold: 0,
  enabled: true,
  retriggeringEnabled: true,
  observer: null,

  didInsertElement () {
    this._super(...arguments);

    scheduleOnce('afterRender', this, function () {
      this.createIntersectionObserver();
    });
  },

  willDestroyElement () {
    this._super(...arguments);

    if (this.observer) {
      this.observer.disconnect();
    }
  },

  createIntersectionObserver () {
    let rootElement = this.rootElement;
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
          if (this.onIntersect) {
            this.onIntersect();
          }
          if (this.enabled && this.retriggeringEnabled) {
            scheduleOnce('afterRender', this, function () {
              observer.unobserve(entry.target);
              observer.observe(entry.target);
            });
          }
        } else {
          if (this.onDiverge) {
            this.onDiverge();
          }
        }
      });
    }, config);

    observer.observe(this.element);

    this.set('observer', observer);
  },

  rootMarginChanged: observer('rootMargin', function () {
    if (this.enabled && this.observer) {
      this.observer.disconnect();
      this.createIntersectionObserver();
    }
  }),

  enabledChanged: observer('enabled', function () {
    if (this.enabled) {
      this.observer.observe(this.element);
    } else {
      this.observer.disconnect();
    }
  })

});
