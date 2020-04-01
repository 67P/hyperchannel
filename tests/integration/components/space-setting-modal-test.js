import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { find, render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import Space from 'hyperchannel/models/space';

module('Integration | Component | space setting modal', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders the form with preset values', async function(assert) {
    const space = new Space({
      "id": "moznet",
      "name": "Mozilla",
      "description": "Mozilla's public IRC network",
      "website": "https://wiki.mozilla.org/IRC",
      "protocol": "IRC",
      "server": {
        "hostname": "irc.mozilla.org",
        "secure": true,
        "port": 6697
      }
    });

    this.preset = space;

    await render(hbs`<SpaceSettingModal @settings={{this.preset}} />`);

    assert.dom('h1').hasText('Space Setting');
    assert.equal(find('input').value.trim(), 'IRC');
  });
});
