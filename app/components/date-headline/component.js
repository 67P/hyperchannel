import { later } from '@ember/runloop';
import { computed } from '@ember/object';
import Component from '@ember/component';
import moment from 'moment';

export default Component.extend({

  classNames: ['date-headline'],

  updateInterval: 120000, // 2 minutes

  headline: computed('message.date', function() {
    let date = moment(this.get('message.date'));

    let scheduleUpdate = () => {
      later(() => {
        this.notifyPropertyChange('message.date');
      }, this.updateInterval);
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
