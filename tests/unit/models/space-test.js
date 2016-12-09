import { moduleFor, test } from 'ember-qunit';
import Channel from 'hyperchannel/models/channel';

moduleFor('model:space', 'Unit | Model | space');

test('#sortedChannels returns channels sorted by name', function(assert) {
  let space = this.subject();

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
