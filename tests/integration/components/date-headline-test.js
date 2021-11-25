import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import Message from 'hyperchannel/models/message';
import moment from 'moment';

module('Integration | Component | date-headline', function (hooks) {
  setupRenderingTest(hooks);

  test('show headline "Today" for the current day', async function (assert) {
    assert.expect(1);

    this.dateMessage = new Message({
      date: moment().startOf('day').toDate(),
    });

    await render(hbs`<DateHeadline @message={{this.dateMessage}} />`);

    assert.dom(this.element.querySelector('h3')).hasText('Today');
  });

  test('show headline "Yesterday" for the previous day', async function (assert) {
    assert.expect(1);

    this.dateMessage = new Message({
      date: moment().subtract(1, 'day').startOf('day').toDate(),
    });

    await render(hbs`<DateHeadline @message={{this.dateMessage}} />`);

    assert.dom(this.element.querySelector('h3')).hasText('Yesterday');
  });

  test('show headline as a date for all other days', async function (assert) {
    assert.expect(2);

    this.dateMessage = new Message({
      date: moment('2017/02/25', 'YYYY-MM-DD').startOf('day').toDate(),
    });

    await render(hbs`<DateHeadline @message={{this.dateMessage}} />`);

    const headline = this.element.querySelector('h3').textContent.trim();

    // only check for existence of year and day
    // overall format of the date is local specific
    assert.ok(headline.match(/2017/));
    assert.ok(headline.match(/25/));
  });
});
