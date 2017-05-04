import { moduleFor, test } from 'ember-qunit';

moduleFor('service:coms', 'Unit | Service | coms', {
  // Specify the other units that are required for this test.
  needs: ['service:ajax', 'service:logger', 'service:remotestorage',
          'service:sockethub-irc', 'service:sockethub-xmpp']
});

// Replace this with your real tests.
test('it exists', function(assert) {
  let service = this.subject();
  assert.ok(service);
});
