import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | button-submit', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    await render(hbs`<ButtonSubmit />`);

    assert.equal(this.element.textContent.trim(), '');

    await render(hbs`
      <ButtonSubmit>
        template block text
      </ButtonSubmit>
    `);

    assert.equal(this.element.textContent.trim(), 'template block text');
  });
});
