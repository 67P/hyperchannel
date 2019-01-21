import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { run } from '@ember/runloop';

module('Unit | Component | channel-container', function(hooks) {
  setupTest(hooks);

  test('add username mention to message, with empty message', function(assert) {
    let component = this.owner.factoryFor('component:channel-container').create();
    assert.equal(component.newMessage, '');

    run(() => component.send('addUsernameMentionToMessage', 'toshi'));

    assert.equal(component.newMessage, 'toshi: ');
  });

  test('add username mention to message, with existing message', function(assert) {
    let component = this.owner.factoryFor('component:channel-container').create();
    component.set('newMessage', 'hey, wasup?')

    run(() => component.send('addUsernameMentionToMessage', 'toshi'));

    assert.equal(component.newMessage, 'toshi: hey, wasup?',
                 'adds the name in front of the message');
  });

  test('add username mention to message, with existing message with username', function(assert) {
    let component = this.owner.factoryFor('component:channel-container').create();
    component.set('newMessage', 'toshi: hey, wasup?')

    run(() => component.send('addUsernameMentionToMessage', 'toshi'));

    assert.equal(component.newMessage, 'toshi: hey, wasup?',
                 'does not add the name twice');
  });
});
