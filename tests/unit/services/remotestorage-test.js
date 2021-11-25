import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Service | remotestorage', function (hooks) {
  setupTest(hooks);

  test('#rs returns a remoteStorage instance', function (assert) {
    let service = this.owner.lookup('service:remotestorage');
    let remoteStorage = service.rs;

    assert.equal(typeof remoteStorage.scope, 'function');
  });
});
