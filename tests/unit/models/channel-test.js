import { moduleFor, test } from 'ember-qunit';

moduleFor('model:channel', 'Unit | Model | Channel', {
  // Specify the other units that are required for this test.
});

test('it exists', function(assert) {
  var model = this.subject();

  assert.ok(!!model);
});

test('#slug', function(assert) {
  var model = this.subject();
  model.set('name', '#kosmos-dev');

  assert.ok(model.get('slug') === 'kosmos-dev');
});
