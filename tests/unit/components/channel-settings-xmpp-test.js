import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import createComponent from 'hyperchannel/tests/helpers/create-component';

module('Unit | Component | channel-settings-xmpp', function (hooks) {
  setupTest(hooks);

  test('filteredRoomConfigData filters out the roomname configuration key', function (assert) {
    const component = createComponent('component:channel-settings-xmpp', {
      args: {
        channel: {
          roomConfigData: {
            roomname: { label: 'Room Name', value: 'Kosmos Development', type: 'text-single' },
            changesubject: { label: 'May Change Subject', value: true, type: 'boolean' }
          }
        }
      }
    });

    const filtered = component.filteredRoomConfigData;
    assert.ok(filtered, 'filteredRoomConfigData is not null');
    assert.notOk(filtered.roomname, 'roomname should be filtered out');
    assert.ok(filtered.changesubject, 'changesubject should be retained');
    assert.strictEqual(filtered.changesubject.value, true);
  });

  test('filteredRoomConfigData returns null if only roomname is present', function (assert) {
    const component = createComponent('component:channel-settings-xmpp', {
      args: {
        channel: {
          roomConfigData: {
            roomname: { label: 'Room Name', value: 'Kosmos Development', type: 'text-single' }
          }
        }
      }
    });

    const filtered = component.filteredRoomConfigData;
    assert.strictEqual(filtered, null, 'should return null when no other configurations are available');
  });

  test('filteredRoomConfigData returns null if no roomConfigData is present', function (assert) {
    const component = createComponent('component:channel-settings-xmpp', {
      args: {
        channel: {}
      }
    });

    const filtered = component.filteredRoomConfigData;
    assert.strictEqual(filtered, null, 'should return null when roomConfigData is undefined');
  });
});
