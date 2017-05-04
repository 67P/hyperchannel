import { moduleFor, test } from 'ember-qunit';

moduleFor('service:sockethub-xmpp', 'Unit | Service | sockethub xmpp', {
  // Specify the other units that are required for this test.
  needs: ['service:logger', 'service:coms']
});

// Replace this with your real tests.
test('it exists', function(assert) {
  let service = this.subject();
  assert.ok(service);
});
