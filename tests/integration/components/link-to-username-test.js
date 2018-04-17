import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | link to username', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders for a normal user', async function(assert) {
    await render(hbs`{{link-to-username username='test_user'}}`);

    const link = this.element.querySelector('a');

    assert.equal(link.innerText, 'test_user');
    assert.equal(link.className, 'normal ember-view');
  });

  test('it renders for an op user', async function(assert) {
    await render(hbs`{{link-to-username username='@op'}}`);

    const link = this.element.querySelector('a');

    assert.equal(link.innerText, '@op');
    assert.equal(link.className, 'op ember-view');
  });

  test('it renders for a half-op user', async function(assert) {
    await render(hbs`{{link-to-username username='%wannabe_op'}}`);

    const link = this.element.querySelector('a');

    assert.equal(link.innerText, '%wannabe_op');
    assert.equal(link.className, 'half-op ember-view');
  });
});
