import { moduleForComponent, test } from 'ember-qunit';

moduleForComponent('message-chat', 'Unit | Component | message-chat', {
  unit: true
});

test('#formattedContent turns full URLs into links', function(assert) {
  let component = this.subject({
    message: { content: 'visit https://kosmos.org for more info' }
  });

  assert.equal(component.get('formattedContent').toString(), 'visit <a href="https://kosmos.org" class="linkified" target="_blank" rel="nofollow">https://kosmos.org</a> for more info');
});

test('#formattedContent does not turn domain names into links', function(assert) {
  let component = this.subject({
    message: { content: 'visit kosmos.org for more info' }
  });

  assert.equal(component.get('formattedContent').toString(), 'visit kosmos.org for more info');
});

test('#formattedContent escapes HTML', function(assert) {
  var component = this.subject({
    message: { content: 'never gonna <marquee>give you up</marquee>' }
  });

  assert.equal(component.get('formattedContent').toString(), 'never gonna &lt;marquee&gt;give you up&lt;/marquee&gt;');
});

test('#formattedContent converts color codes', function(assert) {
  var component = this.subject({
    message: { content: 'put some \u000313color\u000f into your life' }
  });

  assert.equal(component.get('formattedContent').toString(), 'put some <span class="color-13">color</span> into your life');
});

