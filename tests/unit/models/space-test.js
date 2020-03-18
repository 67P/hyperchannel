import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Space from 'hyperchannel/models/space';
import Channel from 'hyperchannel/models/channel';

module('Unit | Model | space', function(hooks) {
  setupTest(hooks);

  test('#sortedChannels returns channels sorted by name', function(assert) {
    const space = Space.create();

    space.set('channels', [
      Channel.create({name: 'dominica'}),
      Channel.create({name: 'phu quoc'}),
      Channel.create({name: 'lamu'}),
      Channel.create({name: 'canoa'}),
      Channel.create({name: 'flores'})
    ]);

    let sortedChannels = space.get('sortedChannels');
    assert.deepEqual(sortedChannels.mapBy('name'), ['canoa', 'dominica', 'flores', 'lamu', 'phu quoc']);
  });

  test('#loggedChannels returns list of channels when space is Freenode', function(assert) {
    const space = Space.create({ name: 'Freenode' });

    let loggedChannels = space.get('loggedChannels');

    assert.ok(loggedChannels.length > 0);
    assert.ok(loggedChannels.find(function(name) { return name === '#kosmos'; }));
  });

  test('#loggedChannels returns empty list when space is not Freenode', function(assert) {
    const space = Space.create({ name: 'Quakenet' });

    assert.equal(space.get('loggedChannels').length, 0);
  });

  test('#channelNames returns names of the channels', function(assert) {
    const space = Space.create();

    space.set('channels', [
      Channel.create({ name: '#kosmos' }),
      Channel.create({ name: '#kosmos-dev' }),
      Channel.create({ name: '#remotestorage' }),
    ]);

    assert.deepEqual(space.get('channelNames'), ['#kosmos', '#kosmos-dev', '#remotestorage']);
  });

  test('#sockethubChannelIds returns IDs of the channels', function(assert) {
    const space = Space.create();

    space.set('channels', [
      Channel.create({ sockethubChannelId: 'freenode.net/#kosmos' }),
      Channel.create({ sockethubChannelId: 'freenode.net/#kosmos-dev' }),
      Channel.create({ sockethubChannelId: 'freenode.net/#remotestorage' }),
    ]);

    assert.deepEqual(space.get('sockethubChannelIds'), ['freenode.net/#kosmos', 'freenode.net/#kosmos-dev', 'freenode.net/#remotestorage']);
  });
});
