import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Space from 'hyperchannel/models/space';
import Channel from 'hyperchannel/models/channel';

module('Unit | Model | space', function(hooks) {
  setupTest(hooks);

  test('#sortedChannels returns channels sorted by name', function(assert) {
    const space = new Space({
      channels: [
        new Channel({name: 'dominica'}),
        new Channel({name: 'phu quoc'}),
        new Channel({name: 'lamu'}),
        new Channel({name: 'canoa'}),
        new Channel({name: 'flores'})
      ]
    });

    let sortedChannels = space.sortedChannels;
    assert.deepEqual(sortedChannels.mapBy('name'), ['canoa', 'dominica', 'flores', 'lamu', 'phu quoc']);
  });

  test('#loggedChannels returns list of channels when space is Freenode', function(assert) {
    const space = new Space({ name: 'Freenode' });

    let loggedChannels = space.loggedChannels;

    assert.ok(loggedChannels.length > 0);
    assert.ok(loggedChannels.find(function(name) { return name === '#kosmos'; }));
  });

  test('#loggedChannels returns empty list when space is not Freenode', function(assert) {
    const space = new Space({ name: 'Quakenet' });

    assert.equal(space.loggedChannels.length, 0);
  });

  test('#channelNames returns names of the channels', function(assert) {
    const space = new Space();

    space.channels = [
      new Channel({ name: '#kosmos' }),
      new Channel({ name: '#kosmos-dev' }),
      new Channel({ name: '#remotestorage' }),
    ];

    assert.deepEqual(space.channelNames, ['#kosmos', '#kosmos-dev', '#remotestorage']);
  });

  test('#sockethubChannelIds returns IDs of the channels', function(assert) {
    const space = new Space();

    space.channels = [
      new Channel({ sockethubChannelId: 'freenode.net/#kosmos' }),
      new Channel({ sockethubChannelId: 'freenode.net/#kosmos-dev' }),
      new Channel({ sockethubChannelId: 'freenode.net/#remotestorage' }),
    ];

    assert.deepEqual(space.sockethubChannelIds, ['freenode.net/#kosmos', 'freenode.net/#kosmos-dev', 'freenode.net/#remotestorage']);
  });
});
