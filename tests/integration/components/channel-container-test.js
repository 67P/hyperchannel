import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, settled, waitUntil, click } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import Service from '@ember/service';
import Channel from 'hyperchannel/models/channel';
import Message from 'hyperchannel/models/message';
import { ircAccount } from '../../fixtures/accounts';

class comsStub extends Service {
  loadArchiveMessages () {}
}

const TEMPLATE = hbs`
  <ChannelContainer @channel={{this.channel}}
                    @onMessage={{this.noop}}
                    @onCommand={{this.noop}}
                    @onMenu={{this.noop}}
                    @onLeaveChannel={{this.noop}}
                    @addUsernameMentionToMessage={{this.noop}} />
`;

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

  test('stops auto-loading and offers a retry when loading older messages fails', async function (assert) {
    let calls = 0;
    class FailingComs extends Service {
      async loadOlderMessages () {
        calls += 1;
        throw new Error('boom');
      }
    }
    this.owner.register('service:coms', FailingComs);

    this.channel.hasOlderMessages = true;

    await render(TEMPLATE);

    // Constrain the scroller so the "fill the viewport" auto-load path runs.
    const scroller = document.getElementById('channel-content');
    scroller.style.height = '400px';
    scroller.style.overflowY = 'auto';
    window.dispatchEvent(new Event('resize'));

    await waitUntil(() => calls >= 1, { timeout: 2000 });
    await settled();

    assert.strictEqual(calls, 1, 'does not retry the failing request in a loop');
    assert.dom('.history-load-error').exists('shows a retry affordance');
    assert.dom('.history-start').doesNotExist('does not claim the beginning of history was reached');

    await click('.history-load-error button');
    await waitUntil(() => calls >= 2, { timeout: 2000 });

    assert.strictEqual(calls, 2, 'retry calls the loader again');
  });

  test('applies the initial render window when the async archive batch arrives', async function (assert) {
    // A freshly joined channel has no messages yet; the archive is loaded
    // asynchronously after the component has sized its window.
    this.channel = new Channel({ account: ircAccount, name: '#big', displayName: '#big' });

    await render(TEMPLATE);

    // Constrain the scroller so the fill path doesn't reveal the whole batch.
    const scroller = document.getElementById('channel-content');
    scroller.style.flex = '0 0 400px';
    scroller.style.height = '400px';
    scroller.style.overflowY = 'auto';
    scroller.style.overflowAnchor = 'none';
    await settled();

    for (let i = 0; i < 120; i++) {
      this.channel.addMessage(new Message({
        type: 'message-chat',
        id: `m${i}`,
        date: new Date(Date.now() + i * 1000),
        nickname: 'alice',
        content: `message ${i}`
      }));
    }
    await settled();

    assert.strictEqual(
      this.element.querySelectorAll('#channel-content .msg-content').length,
      50,
      'renders the initial window of 50 messages, not the whole batch'
    );
  });
});

