import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { run } from '@ember/runloop';
import createComponent from 'hyperchannel/tests/helpers/create-component';

module('Unit | Component | channel-container', function(hooks) {
  setupTest(hooks);

  test('add username mention to message, with empty message', function(assert) {
    const component = createComponent('component:channel-container');
    component.focusMessageInputField = function () { return true; }
    assert.equal(component.args.newMessage, null);

    run(() => component.addUsernameMentionToMessage('toshi'));

    assert.equal(component.args.newMessage, 'toshi: ');
  });

  test('add username mention to message, with existing message', function(assert) {
    const component = createComponent('component:channel-container');
    component.focusMessageInputField = function () { return true; }
    component.args.newMessage = 'hey, wasup?';

    run(() => component.addUsernameMentionToMessage('toshi'));

    assert.equal(component.args.newMessage, 'toshi: hey, wasup?',
                 'adds the name in front of the message');
  });

  test('add username mention to message, with existing message with username', function(assert) {
    const component = createComponent('component:channel-container');
    component.focusMessageInputField = function () { return true; }
    component.args.newMessage ='toshi: hey, wasup?';

    run(() => component.addUsernameMentionToMessage('toshi'));

    assert.equal(component.args.newMessage, 'toshi: hey, wasup?',
                 'does not add the name twice');
  });
});
