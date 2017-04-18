import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import Space from 'hyperchannel/models/space';

moduleForComponent('space-setting-modal', 'Integration | Component | space setting modal', {
  integration: true
});

test('it renders the form with preset values', function(assert) {
  this.set('preset', Space.create({
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
  }));

  this.render(hbs`{{space-setting-modal settings=preset}}`);

  assert.equal(this.$().find('h1').text().trim(), 'Space Setting');
  assert.equal(this.$().find('input').first().val().trim(), 'Mozilla');
});
