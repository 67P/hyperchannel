import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('link-to-username', 'Integration | Component | link to username', {
  integration: true
});

test('it renders for a normal user', function(assert) {
  this.render(hbs`{{link-to-username username='test_user'}}`);

  assert.equal(this.$().text().trim(), 'test_user');
  assert.equal(this.$().find('a').first().attr('class'), 'normal ember-view');
});

test('it renders for an op user', function(assert) {
  this.render(hbs`{{link-to-username username='@op'}}`);

  assert.equal(this.$().text().trim(), '@op');
  assert.equal(this.$().find('a').first().attr('class'), 'op ember-view');
});

test('it renders for a half-op user', function(assert) {
  this.render(hbs`{{link-to-username username='%wannabe_op'}}`);

  assert.equal(this.$().text().trim(), '%wannabe_op');
  assert.equal(this.$().find('a').first().attr('class'), 'half-op ember-view');
});
