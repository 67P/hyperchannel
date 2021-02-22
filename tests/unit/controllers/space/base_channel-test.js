import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { run } from '@ember/runloop';

module('Unit | Controller | space/base_channel', function(hooks) {
  setupTest(hooks);

  test('add username mention to message, with empty message', function(assert) {
    const controller = this.owner.lookup('controller:space/base_channel');
    controller.focusMessageInputField = function () { return true; }
    assert.equal(controller.newMessage, null);

    run(() => controller.addUsernameMentionToMessage('toshi'));

    assert.equal(controller.newMessage, 'toshi: ');
  });

  test('add username mention to message, with existing message', function(assert) {
    const controller = this.owner.lookup('controller:space/base_channel');
    controller.focusMessageInputField = function () { return true; }
    controller.newMessage = 'hey, wasup?';

    run(() => controller.addUsernameMentionToMessage('toshi'));

    assert.equal(controller.newMessage, 'toshi: hey, wasup?',
                 'adds the name in front of the message');
  });

  test('add username mention to message, with existing message with username', function(assert) {
    const controller = this.owner.lookup('controller:space/base_channel');
    controller.focusMessageInputField = function () { return true; }
    controller.newMessage ='toshi: hey, wasup?';

    run(() => controller.addUsernameMentionToMessage('toshi'));

    assert.equal(controller.newMessage, 'toshi: hey, wasup?',
                 'does not add the name twice');
  });
});
