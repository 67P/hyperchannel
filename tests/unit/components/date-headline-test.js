import { moduleForComponent, test } from 'ember-qunit';
import Message from 'hyperchannel/models/message';
import moment from 'moment';

moduleForComponent('date-headline', 'Unit | Component | date headline', {
  unit: true
});

test('#headline is "Today" for the current day', function(assert) {
  let component = this.subject({
    message: Message.create({
      date: moment().startOf('day').toDate()
    })
  });

  assert.equal(component.get('headline'), 'Today');
});

test('#headline is "Yesterday" for the previous day', function(assert) {
  let component = this.subject({
    message: Message.create({
      date: moment().subtract(1, 'day').startOf('day').toDate()
    })
  });

  assert.equal(component.get('headline'), 'Yesterday');
});

test('#headline is a date for all other days', function(assert) {
  let component = this.subject({
    message: Message.create({
      date: moment('2017/02/25').startOf('day').toDate()
    })
  });

  assert.equal(component.get('headline'), '2017/02/25');
});
