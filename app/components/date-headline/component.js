import Ember from 'ember';
import moment from 'moment';

export default Ember.Component.extend({

  classNames: ['date-headline'],

  updateInterval: 120000, // 2 minutes

  headline: Ember.computed('message.date', function() {
    let date = moment(this.get('message.date'));

    let scheduleUpdate = () => {
      Ember.run.later(() => {
        this.notifyPropertyChange('message.date');
      }, this.get('updateInterval'));
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
