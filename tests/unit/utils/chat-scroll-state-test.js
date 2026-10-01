import { module, test } from 'qunit';
import {
  ScrollAction,
  createScrollState,
  isAtBottom,
  isNearTop,
  reduceScrollState,
} from 'hyperchannel/utils/chat-scroll-state';

const metrics = (scrollTop, scrollHeight, clientHeight) => ({
  scrollTop,
  scrollHeight,
  clientHeight,
});

module('Unit | Utility | chat scroll state', function () {
  module('isAtBottom', function () {
    test('is true when the content fits entirely', function (assert) {
      assert.true(isAtBottom(metrics(0, 300, 500)));
    });

    test('is true within the threshold of the bottom', function (assert) {
      assert.true(isAtBottom(metrics(700, 1250, 500))); // 50px remaining
    });

    test('is false when scrolled away from the bottom', function (assert) {
      assert.false(isAtBottom(metrics(400, 1250, 500))); // 350px remaining
    });
  });

  module('isNearTop', function () {
    test('is false when the content fits entirely', function (assert) {
      assert.false(isNearTop(metrics(0, 300, 500)));
    });

    test('is true within the threshold of the top', function (assert) {
      assert.true(isNearTop(metrics(150, 1250, 500)));
    });

    test('is false away from the top', function (assert) {
      assert.false(isNearTop(metrics(600, 1250, 500)));
    });
  });

  module('reduceScrollState', function () {
    test('reset returns to a sticky bottom state and scrolls down', function (assert) {
      const dirty = {
        ...createScrollState(),
        atBottom: false,
        stickToBottom: false,
        newMessageCount: 4,
        showJumpToLatest: true,
      };

      const { state, effects } = reduceScrollState(dirty, { type: 'reset' });

      assert.true(state.stickToBottom);
      assert.strictEqual(state.newMessageCount, 0);
      assert.strictEqual(state.showJumpToLatest, false);
      assert.deepEqual(effects, [ScrollAction.ScrollToBottom]);
    });

    test('scroll-to-bottom keeps the detached state until the scroll settles', function (assert) {
      const detached = {
        ...createScrollState(),
        atBottom: false,
        stickToBottom: false,
        newMessageCount: 2,
        showJumpToLatest: true,
      };

      const { state, effects } = reduceScrollState(detached, { type: 'scroll-to-bottom' });

      assert.true(state.stickToBottom);
      assert.false(state.atBottom, 'stays detached until the scroll finishes');
      assert.strictEqual(state.newMessageCount, 0);
      assert.strictEqual(state.showJumpToLatest, false);
      assert.deepEqual(effects, [ScrollAction.ScrollToBottom]);
    });

    test('scroll-settled marks the list at the bottom while sticking', function (assert) {
      const detached = { ...createScrollState(), atBottom: false, stickToBottom: true };

      const { state, effects } = reduceScrollState(detached, { type: 'scroll-settled' });

      assert.true(state.atBottom);
      assert.deepEqual(effects, []);
    });

    test('scroll-settled does nothing when not sticking to the bottom', function (assert) {
      const detached = { ...createScrollState(), atBottom: false, stickToBottom: false };

      const { state } = reduceScrollState(detached, { type: 'scroll-settled' });

      assert.false(state.atBottom);
    });

    test('scroll-settled stays detached when the target was not reached', function (assert) {
      const detached = { ...createScrollState(), atBottom: false, stickToBottom: true };

      const { state, effects } = reduceScrollState(detached, {
        type: 'scroll-settled',
        reached: false,
      });

      assert.false(state.atBottom, 'does not claim to be at the bottom');
      assert.true(state.stickToBottom, 'keeps the stickiness intent');
      assert.deepEqual(effects, []);
    });

    test('a user scroll to the bottom re-enables stickiness and clears the pill', function (assert) {
      const detached = {
        ...createScrollState(),
        stickToBottom: false,
        newMessageCount: 3,
        showJumpToLatest: true,
      };

      const { state, effects } = reduceScrollState(detached, {
        type: 'user-scroll',
        metrics: metrics(750, 1250, 500),
      });

      assert.true(state.stickToBottom);
      assert.true(state.atBottom);
      assert.strictEqual(state.newMessageCount, 0);
      assert.strictEqual(state.showJumpToLatest, false);
      assert.deepEqual(effects, []);
    });

    test('a user scroll away from the bottom detaches and captures an anchor', function (assert) {
      const { state, effects } = reduceScrollState(createScrollState(), {
        type: 'user-scroll',
        metrics: metrics(300, 1250, 500),
      });

      assert.false(state.stickToBottom);
      assert.false(state.atBottom);
      assert.deepEqual(effects, [ScrollAction.CaptureAnchor]);
    });

    test('appended content scrolls to the bottom while sticky', function (assert) {
      const { effects } = reduceScrollState(createScrollState(), {
        type: 'content-appended',
        count: 1,
      });

      assert.deepEqual(effects, [ScrollAction.ScrollToBottom]);
    });

    test('appended content while detached counts new messages', function (assert) {
      const detached = { ...createScrollState(), stickToBottom: false };

      const first = reduceScrollState(detached, { type: 'content-appended', count: 2 });
      const second = reduceScrollState(first.state, { type: 'content-appended', count: 1 });

      assert.strictEqual(second.state.newMessageCount, 3);
      assert.true(second.state.showJumpToLatest);
      assert.deepEqual(second.effects, []);
    });

    test('resized content keeps the anchor while detached', function (assert) {
      const detached = { ...createScrollState(), stickToBottom: false };

      const { effects } = reduceScrollState(detached, { type: 'content-resized' });

      assert.deepEqual(effects, [ScrollAction.RestoreAnchor]);
    });

    test('prepended older messages restore the anchor', function (assert) {
      const detached = { ...createScrollState(), stickToBottom: false };

      const { effects } = reduceScrollState(detached, { type: 'older-prepended' });

      assert.deepEqual(effects, [ScrollAction.RestoreAnchor]);
    });

    test('reaching the top loads older messages without anchoring while stuck to the bottom', function (assert) {
      const { effects } = reduceScrollState(createScrollState(), {
        type: 'reached-top',
        hasOlder: true,
        isLoadingOlder: false,
      });

      assert.deepEqual(effects, [ScrollAction.LoadOlder]);
    });

    test('reaching the top captures an anchor and loads older messages while reading history', function (assert) {
      const detached = { ...createScrollState(), stickToBottom: false };

      const { effects } = reduceScrollState(detached, {
        type: 'reached-top',
        hasOlder: true,
        isLoadingOlder: false,
      });

      assert.deepEqual(effects, [ScrollAction.CaptureAnchor, ScrollAction.LoadOlder]);
    });

    test('reaching the top does not load when there is nothing older', function (assert) {
      const { effects } = reduceScrollState(createScrollState(), {
        type: 'reached-top',
        hasOlder: false,
        isLoadingOlder: false,
      });

      assert.deepEqual(effects, []);
    });

    test('reaching the top does not load while a load is in flight', function (assert) {
      const { effects } = reduceScrollState(createScrollState(), {
        type: 'reached-top',
        hasOlder: true,
        isLoadingOlder: true,
      });

      assert.deepEqual(effects, []);
    });
  });
});
