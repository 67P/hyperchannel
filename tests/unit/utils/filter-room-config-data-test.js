import { module, test } from 'qunit';
import filterRoomConfigData from 'hyperchannel/utils/filter-room-config-data';

module('Unit | Utility | filter room config data', function () {
  test('filters out the roomname configuration key', function (assert) {
    const filtered = filterRoomConfigData({
      roomname: { label: 'Room Name', value: 'Kosmos Development', type: 'text-single' },
      changesubject: { label: 'May Change Subject', value: true, type: 'boolean' },
    });

    assert.ok(filtered, 'filteredRoomConfigData is not null');
    assert.notOk(filtered.roomname, 'roomname should be filtered out');
    assert.ok(filtered.changesubject, 'changesubject should be retained');
    assert.strictEqual(filtered.changesubject.value, true);
  });

  test('returns null if only roomname is present', function (assert) {
    const filtered = filterRoomConfigData({
      roomname: { label: 'Room Name', value: 'Kosmos Development', type: 'text-single' },
    });

    assert.strictEqual(filtered, null, 'should return null when no other configurations are available');
  });

  test('returns null if no roomConfigData is present', function (assert) {
    assert.strictEqual(filterRoomConfigData(undefined), null);
    assert.strictEqual(filterRoomConfigData(null), null);
  });
});
