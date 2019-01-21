import { later } from '@ember/runloop';
import { computed } from '@ember/object';
import Component from '@ember/component';
import moment from 'moment';
import config from '../../config/environment';

export default Component.extend({

  classNames: ['date-headline'],

  updateInterval: 120000, // 2 minutes

  headline: computed('message.date', function() {
    let date = moment(this.get('message.date'));

    let scheduleUpdate = () => {
      // don't schedule updates during testing, because it makes the tests time out
      if (!config.environment === 'testing') {
        later(() => {
          this.notifyPropertyChange('message.date');
        }, this.updateInterval);
      }
    };

    if (date.isSame(moment(), 'day')) {
      scheduleUpdate();
      return 'Today';
    }

    if (date.isSame(moment().subtract(1, 'day'), 'day')) {
      scheduleUpdate();
      return 'Yesterday';
    }

    return this.get('message.date').toLocaleDateString();
  })

});
