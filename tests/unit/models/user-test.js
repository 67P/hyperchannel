import { moduleForModel, test } from 'ember-qunit';
import User from 'hyperchannel/models/user';

moduleForModel('user', 'Unit | Model | user', {
  // Specify the other units that are required for this test.
  needs: []
});

test('#username when user is not an op', function(assert) {
  var user = User.create({ username: 'test_user' });
  assert.equal(user.get('username'), 'test_user');
});

test('#decoratedUsername when user is not an op', function(assert) {
  var user = User.create({ username: 'test_user' });
  assert.equal(user.get('decoratedUsername'), 'test_user');
});

test('#role when user is not an op', function(assert) {
  var user = User.create({ username: 'test_user' });
  assert.equal(user.get('role'), 'normal');
});

test('#username when user is an op', function(assert) {
  var user = User.create({ username: '@test_op' });
  assert.equal(user.get('username'), 'test_op');
});

test('#decoratedUsername when user is an op', function(assert) {
  var user = User.create({ username: '@test_op' });
  assert.equal(user.get('decoratedUsername'), '@test_op');
});

test('#role when user is an op', function(assert) {
  var user = User.create({ username: '@test_op' });
  assert.equal(user.get('role'), 'op');
});
