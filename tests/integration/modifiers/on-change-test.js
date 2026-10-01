import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, settled } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { tracked } from '@glimmer/tracking';

class State {
  @tracked counter = 0;
}

module('Integration | Modifier | on-change', function (hooks) {
  setupRenderingTest(hooks);

  test('runs on install and when the value changes, but not on unrelated rerenders', async function (assert) {
    this.calls = [];
    this.value = 'a';
    this.other = 0;
    this.handleChange = (value) => this.calls.push(value);

    await render(hbs`
      <div {{on-change this.value this.handleChange}} data-other={{this.other}}></div>
    `);

    assert.deepEqual(this.calls, ['a'], 'runs once on install');

    this.set('other', 1);
    await settled();

    assert.deepEqual(this.calls, ['a'], 'does not rerun on an unrelated rerender');

    this.set('value', 'b');
    await settled();

    assert.deepEqual(this.calls, ['a', 'b'], 'reruns when the value changes');
  });

  test('does not rerun when tracked state read by the callback changes', async function (assert) {
    this.calls = [];
    this.value = 'a';
    this.state = new State();
    this.handleChange = (value) => this.calls.push(`${value}:${this.state.counter}`);

    await render(hbs`
      <div {{on-change this.value this.handleChange}}></div>
    `);

    assert.deepEqual(this.calls, ['a:0'], 'runs once on install');

    // The callback reads `state.counter`; changing it must not retrigger the
    // modifier (which would have reset unrelated state, e.g. the render window).
    this.state.counter = 1;
    await settled();

    assert.deepEqual(this.calls, ['a:0'], 'does not rerun when the callback reads changed tracked state');

    this.set('value', 'b');
    await settled();

    assert.deepEqual(this.calls, ['a:0', 'b:1'], 'reruns when the value changes');
  });
});
