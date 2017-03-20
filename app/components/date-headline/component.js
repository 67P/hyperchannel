import Ember from 'ember';
import moment from 'moment';

export default Ember.Component.extend({

  tagName: 'h3',
  classNames: ['date-headline'],

  recalculationInterval: 120000, // 2 minutes

  headline: Ember.computed('message.date', function() {
    let date = moment(this.get('message.date'));

    let scheduleRecalculation = () => {
      Ember.run.later(() => {
        this.notifyPropertyChange('message.date');
      }, this.get('recalculationInterval'));
    };

    if (date.isSame(moment(), 'day')) {
      scheduleRecalculation();
      return 'Today';
    }

    if (date.isSame(moment().subtract(1, 'day'), 'day')) {
      scheduleRecalculation();
      return 'Yesterday';
    }

    return date.format('YYYY/MM/DD');
  })

});
