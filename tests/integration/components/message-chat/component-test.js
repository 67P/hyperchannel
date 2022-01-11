import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import Channel from 'hyperchannel/models/channel';
import Message from 'hyperchannel/models/message';
import { xmppAccount } from '../../../fixtures/accounts';

module('Integration | Component | message-chat', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function() {
    this.set('channel', new Channel({
      account: xmppAccount, name: 'kosmos@kosmos.chat'
    }));
    this.set('message', new Message({
      type: 'message-chat', id: '123abc', date: new Date(),
      nickname: 'the_plague', content: 'never fear, i is here'
    }));
  });

  test('simple message', async function(assert) {
    await render(hbs`<MessageChat @channel={{this.channel}} @message={{this.message}} />`);

    const contentEl = this.element.querySelector('.msg-content');
    assert.equal(contentEl.innerText, this.message.content, 'renders the message content');

    const metaEl = this.element.querySelector('.msg-meta');
    assert.ok(metaEl.querySelector('span').innerText.match(this.message.nickname), `renders the sender's nickname`);

    const avatarEl = this.element.querySelector('.msg-avatar');
    assert.equal(avatarEl.querySelector('span').innerText.length, 1, `renders one letter of the sender's nickname`);
  });

  test('grouped message', async function(assert) {
    this.message.grouped = true;
    await render(hbs`<MessageChat @channel={{this.channel}} @message={{this.message}} />`);

    const contentEl = this.element.querySelector('.msg-content');
    assert.equal(contentEl.innerText, this.message.content, 'renders the message content');

    assert.notOk(this.element.querySelector('.msg-meta'), `hides the meta information`);
    assert.notOk(this.element.querySelector('.msg-avatar span'), `hides the user avatar (placeholder)`);
  });

  test('line breaks', async function(assert) {
    this.message.content = 'The wren\nEarns his living\nNoiselessly.\n- Kobayahsi Issa';
    await render(hbs`<MessageChat @channel={{this.channel}} @message={{this.message}} />`);

    const contentEl = this.element.querySelector('.msg-content');

    assert.equal(contentEl.querySelectorAll('br').length, 3, 'inserts line breaks for LF');

    this.message.content = 'The wren\rEarns his living\rNoiselessly.\r- Kobayahsi Issa';
    await render(hbs`<MessageChat @channel={{this.channel}} @message={{this.message}} />`);
    assert.equal(contentEl.querySelectorAll('br').length, 3, 'inserts line breaks for CR');

    this.message.content = 'The wren\r\nEarns his living\r\nNoiselessly.\r\n- Kobayahsi Issa';
    await render(hbs`<MessageChat @channel={{this.channel}} @message={{this.message}} />`);
    assert.equal(contentEl.querySelectorAll('br').length, 3, 'inserts line breaks for CR+LF');
  });
});
