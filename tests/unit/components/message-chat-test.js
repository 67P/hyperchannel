import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import createComponent from 'hyperchannel/tests/helpers/create-component';

module('Unit | Component | message-chat', function(hooks) {
  setupTest(hooks);

  test('#formattedContent turns full URLs into links', function(assert) {
    let component = createComponent('component:message-chat', {
      message: { content: 'visit https://kosmos.org for more info' }
    });

    assert.equal(component.formattedContent.toString(), 'visit <a href="https://kosmos.org" class="linkified" target="_blank" rel="nofollow noopener">https://kosmos.org</a> for more info');
  });

  test('#formattedContent does not turn domain names into links', function(assert) {
    let component = createComponent('component:message-chat', {
      message: { content: 'visit kosmos.org for more info' }
    });

    assert.equal(component.formattedContent.toString(), 'visit kosmos.org for more info');
  });

  test('#formattedContent does not turn emails into links', function(assert) {
    let component = createComponent('component:message-chat', {
      message: { content: 'hey team@kosmos.org' }
    });

    assert.equal(component.formattedContent.toString(), 'hey team@kosmos.org');
  });

  test('#formattedContent escapes HTML', function(assert) {
    let component = createComponent('component:message-chat', {
      message: { content: 'never gonna <marquee>give you up</marquee>' }
    });

    assert.equal(component.formattedContent.toString(), 'never gonna &lt;marquee&gt;give you up&lt;/marquee&gt;');
  });

  test('#formattedContent converts color codes', function(assert) {
    let component = createComponent('component:message-chat', {
      message: { content: 'put some \u000313color\u000f and \u0002bold\u000f into your life. Or \u000305\u0002both\u000f' }
     });

    assert.equal(component.formattedContent.toString(), 'put some <span class="color-13">color</span> and <span class="bold">bold</span> into your life. Or <span class="color-05"><span class="bold">both</span>');
  });

  test('#formattedContent renders images from image URLs', function(assert) {
    let component = createComponent('component:message-chat', {
      message: { content: 'https://storage.5apps.com/basti/public/shares/160527-1119-magic.gif' }
    });

    assert.equal(component.formattedContent.toString(), '<br><a href="https://storage.5apps.com/basti/public/shares/160527-1119-magic.gif" target="_blank" rel="nofollow noopener"><img src="https://storage.5apps.com/basti/public/shares/160527-1119-magic.gif" class="from-image-url" alt="https://storage.5apps.com/basti/public/shares/160527-1119-magic.gif"></a>');
  });
});
