import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, settled, waitUntil } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

function items (count, startAt = 0) {
  return Array.from({ length: count }, (_, index) => ({ id: `m${startAt + index}` }));
}

function isScrolledToBottom (element) {
  return element.scrollTop + element.clientHeight >= element.scrollHeight - 2;
}

function anchoredNode (scroller) {
  const containerTop = scroller.getBoundingClientRect().top;
  for (const node of scroller.querySelectorAll('[data-message-key]')) {
    if (node.getBoundingClientRect().bottom > containerTop) return node;
  }
  return null;
}

function offsetWithin (scroller, node) {
  return node.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
}

const TEMPLATE = hbs`
  {{! template-lint-disable no-inline-styles }}
  <ChatScroller id="scroller"
                @items={{this.items}}
                @resetKey={{this.resetKey}}
                @hasOlder={{this.hasOlder}}
                @isLoadingOlder={{this.isLoadingOlder}}
                @historyCursor={{this.historyCursor}}
                @onLoadOlder={{this.onLoadOlder}}
                as |scroll|>
    {{#unless scroll.isAtBottom}}
      <button type="button"
              class="jump-to-latest {{if scroll.showJumpToLatest "has-new-messages"}}"
              {{on "click" scroll.scrollToBottom}}>
        <span class="chevron">v</span>
        {{#if scroll.newMessageCount}}
          <span class="count">{{scroll.newMessageCount}} new</span>
        {{/if}}
      </button>
    {{/unless}}
    {{#each this.items key="id" as |item|}}
      <div data-message-key={{item.id}} style="height: 40px;">{{item.id}}</div>
    {{/each}}
  </ChatScroller>
`;

module('Integration | Component | chat-scroller', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.resetKey = 'channel-a';
    this.hasOlder = false;
    this.isLoadingOlder = false;
    this.historyCursor = null;
    this.onLoadOlder = () => {};
  });

  async function renderScroller () {
    await render(TEMPLATE);
    const scroller = document.getElementById('scroller');
    scroller.style.height = '200px';
    scroller.style.overflowY = 'auto';
    await settled();
    return scroller;
  }

  test('scrolls to the bottom on initial render', async function (assert) {
    this.items = items(20);

    const scroller = await renderScroller();
    await waitUntil(() => isScrolledToBottom(scroller), { timeout: 2000 });

    assert.true(isScrolledToBottom(scroller), 'is scrolled to the bottom');
  });

  test('stays at the bottom when items are appended while at the bottom', async function (assert) {
    this.items = items(20);

    const scroller = await renderScroller();
    await waitUntil(() => isScrolledToBottom(scroller), { timeout: 2000 });

    this.set('items', items(25));
    await settled();
    await waitUntil(() => isScrolledToBottom(scroller), { timeout: 2000 });

    assert.true(isScrolledToBottom(scroller), 'still at the bottom after appending');
    assert.dom('.jump-to-latest').doesNotExist('does not show the jump-to-latest button');
  });

  test('shows the scroll-to-bottom button when scrolled up without new messages', async function (assert) {
    this.items = items(20);

    const scroller = await renderScroller();
    await waitUntil(() => isScrolledToBottom(scroller), { timeout: 2000 });
    assert.dom('.jump-to-latest').doesNotExist('hidden while at the bottom');

    scroller.scrollTop = 0;
    scroller.dispatchEvent(new Event('scroll'));
    await settled();

    assert.dom('.jump-to-latest').exists('shows the button when scrolled up');
    assert.dom('.jump-to-latest').doesNotHaveClass(
      'has-new-messages',
      'is in the neutral (no new messages) state'
    );
  });

  test('detaches when scrolled up and offers a way back for new messages', async function (assert) {
    this.items = items(20);

    const scroller = await renderScroller();
    await waitUntil(() => isScrolledToBottom(scroller), { timeout: 2000 });

    // Simulate a user scrolling away from the bottom.
    scroller.scrollTop = 0;
    scroller.dispatchEvent(new Event('scroll'));
    await settled();

    assert.dom('.jump-to-latest').exists('shows the scroll-to-bottom button when scrolled up');
    assert.dom('.jump-to-latest').doesNotHaveClass(
      'has-new-messages',
      'neutral until new messages arrive'
    );

    // A new message arriving while detached should not yank the viewport down,
    // but should offer a way back.
    this.set('items', items(21));
    await settled();
    await waitUntil(() => document.querySelector('.jump-to-latest.has-new-messages'), { timeout: 2000 });

    assert.dom('.jump-to-latest').hasClass('has-new-messages', 'switches to the new-messages state');
    assert.dom('.jump-to-latest .count').hasText('1 new', 'shows the new message count');
    assert.false(isScrolledToBottom(scroller), 'did not jump to the bottom automatically');

    await document.querySelector('.jump-to-latest').click();
    await settled();
    await waitUntil(() => isScrolledToBottom(scroller), { timeout: 2000 });

    assert.true(isScrolledToBottom(scroller), 'jumped to the bottom when clicked');
    assert.dom('.jump-to-latest').doesNotExist('hides the button after jumping');
  });

  test('reaches the bottom when items are appended during the scroll animation', async function (assert) {
    this.items = items(20);

    const scroller = await renderScroller();
    await waitUntil(() => isScrolledToBottom(scroller), { timeout: 2000 });

    // Detach so the scroll-to-bottom button appears.
    scroller.scrollTop = 0;
    scroller.dispatchEvent(new Event('scroll'));
    await settled();
    await waitUntil(() => document.querySelector('.jump-to-latest'), { timeout: 2000 });

    // Start the animation, then grow the content while it is running.
    document.querySelector('.jump-to-latest').click();
    this.set('items', items(30));

    await settled();
    await waitUntil(() => isScrolledToBottom(scroller), { timeout: 2000 });

    assert.true(isScrolledToBottom(scroller), 'reaches the bottom despite content growth');
  });

  test('starts the scroll-to-bottom animation gently from far away', async function (assert) {
    // A long list so a first-frame "jump" (e.g. a fixed fraction of the
    // remaining distance) would be large and obvious.
    this.items = items(60); // 2400px in a 200px window

    const scroller = await renderScroller();
    await waitUntil(() => isScrolledToBottom(scroller), { timeout: 2000 });

    scroller.scrollTop = 0;
    scroller.dispatchEvent(new Event('scroll'));
    await settled();
    await waitUntil(() => document.querySelector('.jump-to-latest'), { timeout: 2000 });

    const before = scroller.scrollTop;
    document.querySelector('.jump-to-latest').click();

    const afterFirstFrame = await new Promise((resolve) => {
      requestAnimationFrame(() => resolve(scroller.scrollTop));
    });
    const firstStep = afterFirstFrame - before;

    assert.true(
      firstStep < 150,
      `first animation step is small (${Math.round(firstStep)}px of 2400px)`
    );

    await settled();
    await waitUntil(() => isScrolledToBottom(scroller), { timeout: 2000 });
    assert.true(isScrolledToBottom(scroller), 'still reaches the bottom');
  });

  test('eases out gently into the bottom (long tail)', async function (assert) {
    this.items = items(60); // 2400px in a 200px window

    const scroller = await renderScroller();
    await waitUntil(() => isScrolledToBottom(scroller), { timeout: 2000 });

    scroller.scrollTop = 0;
    scroller.dispatchEvent(new Event('scroll'));
    await settled();
    await waitUntil(() => document.querySelector('.jump-to-latest'), { timeout: 2000 });

    const end = scroller.scrollHeight - scroller.clientHeight;
    let enteredTailAt = null;
    const onScroll = () => {
      if (enteredTailAt === null && end - scroller.scrollTop <= 40) {
        enteredTailAt = performance.now();
      }
    };
    scroller.addEventListener('scroll', onScroll);

    document.querySelector('.jump-to-latest').click();
    await settled();
    await waitUntil(() => isScrolledToBottom(scroller), { timeout: 3000 });
    scroller.removeEventListener('scroll', onScroll);

    assert.ok(enteredTailAt !== null, 'reached the last 40px during the animation');
    const tailMs = performance.now() - enteredTailAt;
    assert.true(
      tailMs >= 150,
      `the last 40px is eased out over time (${Math.round(tailMs)}ms)`
    );
  });

  test('does not start a second scroll animation when activated twice', async function (assert) {
    this.items = items(60);

    const scroller = await renderScroller();
    await waitUntil(() => isScrolledToBottom(scroller), { timeout: 2000 });

    // Detach so the scroll-to-bottom button appears.
    scroller.scrollTop = 0;
    scroller.dispatchEvent(new Event('scroll'));
    await settled();
    await waitUntil(() => document.querySelector('.jump-to-latest'), { timeout: 2000 });

    const button = document.querySelector('.jump-to-latest');
    const raf = sinon.spy(window, 'requestAnimationFrame');
    try {
      // Two synchronous activations, before any frame runs.
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      assert.strictEqual(raf.callCount, 1, 'only one animation loop is started');
    } finally {
      raf.restore();
    }

    await settled();
    await waitUntil(() => isScrolledToBottom(scroller), { timeout: 3000 });
    assert.true(isScrolledToBottom(scroller), 'still reaches the bottom');
  });

  test('loads older history until the viewport is filled', async function (assert) {
    this.items = items(2); // 80px in a 200px window

    let calls = 0;
    this.onLoadOlder = () => {
      calls += 1;
      const older = [{ id: `old${calls}a` }, { id: `old${calls}b` }];
      this.set('items', [...older, ...this.items]);
    };

    const scroller = await renderScroller();

    // Enable history loading only once the container is constrained to a
    // fixed height, otherwise the content trivially "fits" during layout.
    this.set('hasOlder', true);
    await settled();
    window.dispatchEvent(new Event('resize'));

    // Auto-loading continues until the list is long enough that the bottom is
    // no longer within the top zone (AT_TOP_THRESHOLD), not merely until it
    // starts to overflow: a small overflow still reads as "at bottom" at every
    // position, so stopping at the first pixel of overflow would strand history.
    await waitUntil(
      () => scroller.scrollHeight - scroller.clientHeight > 200,
      { timeout: 3000 }
    );
    await settled();

    assert.true(scroller.scrollHeight > scroller.clientHeight, 'viewport is filled');
    assert.ok(calls >= 2, `loaded multiple pages to fill the viewport (${calls})`);

    const callsWhenFilled = calls;
    window.dispatchEvent(new Event('resize'));
    await settled();

    assert.strictEqual(calls, callsWhenFilled, 'does not keep loading once the viewport is filled');
  });

  test('keeps filling through sparse archive pages that only advance the cursor', async function (assert) {
    this.items = items(2); // content fits the 200px window

    let calls = 0;
    this.onLoadOlder = () => {
      calls += 1;
      // A sparse page: no new messages, but the archive cursor still advances.
      this.set('historyCursor', `cursor-${calls}`);
    };

    await renderScroller();

    this.set('hasOlder', true);
    await settled();
    window.dispatchEvent(new Event('resize'));
    await waitUntil(() => calls >= 1, { timeout: 2000 });

    // Simulate each in-flight load completing, which releases the single-flight
    // lock and lets the scroller request the next page.
    for (let i = 0; i < 5; i++) {
      this.set('isLoadingOlder', true);
      await settled();
      this.set('isLoadingOlder', false);
      await settled();
    }

    // The previous height-only guard stopped after three attempts without
    // growth; cursor progress must keep the automatic fill going.
    assert.ok(calls >= 4, `kept loading past the height-only limit (${calls})`);
  });

  test('requests older history once when entering the top zone', async function (assert) {
    this.items = items(20);

    let calls = 0;
    this.onLoadOlder = () => {
      calls += 1;
    };

    const scroller = await renderScroller();
    this.set('hasOlder', true);
    await settled();

    // Enter the top zone.
    scroller.scrollTop = 100;
    scroller.dispatchEvent(new Event('scroll'));
    await waitUntil(() => calls >= 1, { timeout: 2000 });

    // Keep firing scroll events while "holding" in the top zone.
    for (const scrollTop of [120, 90]) {
      scroller.scrollTop = scrollTop;
      scroller.dispatchEvent(new Event('scroll'));
      await settled();
    }

    assert.strictEqual(calls, 1, 'only requests history once while within the top zone');
  });

  test('does not request older history while a load is in flight', async function (assert) {
    this.items = items(20);

    let calls = 0;
    this.onLoadOlder = () => {
      calls += 1;
    };

    const scroller = await renderScroller();
    this.set('hasOlder', true);
    this.set('isLoadingOlder', true);
    await settled();

    scroller.scrollTop = 100;
    scroller.dispatchEvent(new Event('scroll'));
    await settled();

    assert.strictEqual(calls, 0, 'does not request a new page while loading');
  });

  test('loads the next page after the in-flight load finishes when at the top', async function (assert) {
    this.items = items(20);

    let calls = 0;
    this.onLoadOlder = () => {
      calls += 1;
    };

    const scroller = await renderScroller();
    await waitUntil(() => isScrolledToBottom(scroller), { timeout: 2000 }); // let the initial programmatic scroll release its lock

    this.set('hasOlder', true);
    this.set('isLoadingOlder', true);
    await settled();

    // Reach the top while a page is still loading; the request is deferred.
    scroller.scrollTop = 100;
    scroller.dispatchEvent(new Event('scroll'));
    await settled(); // let native scroll/scrollend events fully settle
    assert.strictEqual(calls, 0, 'does not start a concurrent load');

    // When the in-flight load finishes, the next page is requested automatically
    // without having to scroll down and back up.
    this.set('isLoadingOlder', false);
    await settled();
    await waitUntil(() => calls >= 1, { timeout: 2000 });

    assert.strictEqual(calls, 1, 'requests the next page once loading finishes');
  });

  test('keeps the anchored message in place when older messages are prepended', async function (assert) {
    this.items = items(20);

    const scroller = await renderScroller();
    await waitUntil(() => isScrolledToBottom(scroller), { timeout: 2000 });

    scroller.scrollTop = 120;
    scroller.dispatchEvent(new Event('scroll'));
    await settled();

    const before = anchoredNode(scroller);
    assert.ok(before, 'has an anchored message');
    const beforeKey = before.dataset.messageKey;
    const beforeOffset = offsetWithin(scroller, before);

    const older = [{ id: 'old1' }, { id: 'old2' }, { id: 'old3' }];
    this.set('items', [...older, ...this.items]);
    await settled();

    const after = scroller.querySelector(`[data-message-key="${beforeKey}"]`);
    assert.ok(after, 'the anchored message is still rendered');
    assert.ok(
      Math.abs(offsetWithin(scroller, after) - beforeOffset) <= 2,
      `anchor offset preserved (before=${beforeOffset}, after=${offsetWithin(scroller, after)})`
    );
  });

  test('keeps the anchored message in place when older messages are prepended and a new message is appended', async function (assert) {
    this.items = items(20);

    const scroller = await renderScroller();
    await waitUntil(() => isScrolledToBottom(scroller), { timeout: 2000 });

    scroller.scrollTop = 120;
    scroller.dispatchEvent(new Event('scroll'));
    await settled();

    const before = anchoredNode(scroller);
    assert.ok(before, 'has an anchored message');
    const beforeKey = before.dataset.messageKey;
    const beforeOffset = offsetWithin(scroller, before);

    const older = [{ id: 'old1' }, { id: 'old2' }, { id: 'old3' }];
    this.set('items', [...older, ...this.items, { id: 'new1' }]);
    await settled();

    const after = scroller.querySelector(`[data-message-key="${beforeKey}"]`);
    assert.ok(after, 'the anchored message is still rendered');
    assert.ok(
      Math.abs(offsetWithin(scroller, after) - beforeOffset) <= 2,
      `anchor offset preserved (before=${beforeOffset}, after=${offsetWithin(scroller, after)})`
    );
  });
});
