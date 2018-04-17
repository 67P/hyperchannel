import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | app container', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    await render(hbs`{{app-container}}`);

    assert.equal(this.element.innerText.trim(), '');

    // Template block usage:
    await render(hbs`
      {{#app-container}}
        template block text
      {{/app-container}}
    `);

    assert.equal(this.element.innerText.trim(), 'template block text');
  });
});
