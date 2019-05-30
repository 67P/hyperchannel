import Component from '@ember/component';
import { scheduleOnce } from '@ember/runloop';
import { observer } from '@ember/object';

export default Component.extend({

  rootElement: null,
  rootMargin: '100px',
  threshold: 0,
  enabled: true,
  observer: null,

  didInsertElement () {
    this._super(...arguments);

    scheduleOnce('afterRender', this, function () {
      this.createIntersectionObserver();
    });
  },

  createIntersectionObserver () {
    const config = {
      root: this.rootElement,
      rootMargin: this.rootMargin,
      threshold: this.threshold
    };

    let observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (this.onIntersect) {
            this.onIntersect();
          }
          if (this.enabled) {
            scheduleOnce('afterRender', this, function () {
              observer.unobserve(entry.target);
              observer.observe(entry.target);
            });
          }
        }
      });
    }, config);

    observer.observe(this.element);

    this.set('observer', observer);
  },

  enabledChanged: observer('enabled', function () {
    if (this.enabled) {
      this.observer.observe(this.element);
    } else {
      this.observer.disconnect();
    }
  })

});
