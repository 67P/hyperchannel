import Ember from 'ember';
import moment from 'moment';

export default Ember.Component.extend({

  tagName: 'h3',
  classNames: ['date-headline'],

  day: Ember.computed('message.date', function() {
    return moment(this.get('message.date')).format('YYYY-MM-DD');
  })

});
