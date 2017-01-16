import { moduleForComponent, test } from 'ember-qunit';

moduleForComponent('message-chat', 'Unit | Component | message-chat', {
  unit: true
});

test('#formattedContent turns URLs into links', function(assert) {
  let component = this.subject({
    message: { content: 'visit kosmos.org for more info' }
  });

  assert.equal(component.get('formattedContent').toString(), 'visit <a href="https://kosmos.org" class="linkified" target="_blank" rel="nofollow">kosmos.org</a> for more info');
});

test('#formattedContent escapes HTML', function(assert) {
  var component = this.subject({
    message: { content: 'never gonna <marquee>give you up</marquee>' }
  });

  assert.equal(component.get('formattedContent').toString(), 'never gonna &lt;marquee&gt;give you up&lt;/marquee&gt;');
});

