import { moduleFor, test } from 'ember-qunit';

moduleFor('service:remotestorage', 'Unit | Service | remotestorage', {
  // Specify the other units that are required for this test.
  // needs: ['service:foo']
});

test('#rs returns a remoteStorage instance', function(assert) {
  let service = this.subject();
  let remoteStorage = service.get('rs');

  assert.equal(typeof remoteStorage.scope, 'function');
});
