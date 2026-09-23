import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import Service from '@ember/service';
import Channel from 'hyperchannel/models/channel';
import Message from 'hyperchannel/models/message';
import { ircAccount } from '../../fixtures/accounts';

class comsStub extends Service {
  loadArchiveMessages () {}
}

module('Integration | Component | channel-container', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:coms', comsStub);

    this.channel = new Channel({
      account: ircAccount,
      name: '#kosmos',
      displayName: '#kosmos'
    });

    this.channel.addMessage(new Message({
      type: 'message-chat',
      id: '123abc',
      date: new Date(),
      nickname: 'alice',
      content: 'hello world'
    }));

    this.noop = () => {};
  });

  test('renders date headlines as DateHeadline, not MessageChat', async function (assert) {
    await render(hbs`
      <ChannelContainer @channel={{this.channel}}
                        @onMessage={{this.noop}}
                        @onCommand={{this.noop}}
                        @onMenu={{this.noop}}
                        @onLeaveChannel={{this.noop}}
                        @addUsernameMentionToMessage={{this.noop}} />
    `);

    const headline = this.element.querySelector('#channel-content h3');
    assert.strictEqual(headline?.innerText.trim(), 'Today', 'renders the date headline');

    const messageContents = this.element.querySelectorAll('.msg-content');
    assert.strictEqual(messageContents.length, 1, 'renders only the chat message with MessageChat');
    assert.strictEqual(messageContents[0].innerText.trim(), 'hello world', 'renders the chat message content');
  });
});
