# Ember Upgrade Summary

This document tracks the major Ember upgrade milestones for Hyperchannel, most
recent last.

## Upgrade Path Completed
- Ember 3.24 → 3.28 (last 3.x LTS) ✅
- Ember 3.28 → 4.4 (first 4.x LTS) ✅
- Ember 4.4 → 4.12 (last 4.x LTS) ✅
- Ember 4.12 → 5.4 (5.x LTS) ✅
- Ember 5.4 → 6.4 (LTS) ✅
- Ember 6.4 → 7.3 (with Vite/Embroider) ✅

## Modernization Changes

### Array Handling (40+ occurrences)
- **For reactive arrays**: Use `TrackedArray` from `tracked-built-ins` with `@tracked` decorator
  - Service/model arrays that need to trigger re-renders: `@tracked arrayName = new TrackedArray([])`
  - Example: `accounts`, `channels`, `messages`, `userList`
- **For computed/derived arrays**: Use native JavaScript arrays with `@cached` getters
  - Converted EmberArray methods to standard JavaScript:
  - `pushObject()` → `push()`
  - `removeObject(item)` → `splice(indexOf(item), 1)`
  - `lastObject` → `at(-1)` or `[length-1]`
  - `firstObject` → `[0]` (TrackedArray no longer provides the EmberArray
    helpers; leaving `firstObject` yielded `undefined` and broke route
    fallbacks, e.g. opening an XMPP DM from the user list)
  - `filterBy('prop', val)` → `filter(item => item.prop === val)`
  - `findBy('prop', val)` → `find(item => item.prop === val)`
  - `sortBy('prop')` → `sort((a,b) => ...)`
  - `mapBy('prop').uniq()` → `[...new Set(array.map(...))]`

**Files Updated:**
- `app/models/base_channel.js`
- `app/services/coms.js`
- `app/services/logger.js`
- `app/services/sockethub-irc.js`
- `app/services/sockethub-xmpp.js`
- `app/components/*` (channel-nav, add-chat-account-*, join-channel, message-user-actions)
- `app/controllers/base_channel.js`
- `app/routes/base_channel.js`

### Component Modernization

#### Template-Only Components
Added explicit `templateOnlyComponent()` exports for Ember 6 compatibility:
- `app/components/button-submit/component.js`
- `app/components/flash-message-error/component.js`
- `app/components/notification-topic-change/component.js`
- `app/components/settings-container/component.js`

#### Deprecated API Replacements
- **TextField**: Converted `channel-input-field` from `@ember/component/text-field` to Glimmer component with native `<input>`
- **htmlSafe**: Removed `new` keyword - `htmlSafe()` is a function, not a constructor
  - Fixed in `app/models/channel.js`
  - Fixed in `app/helpers/html-safe.js`

### Test Infrastructure

#### Import Fixes
- Replaced deprecated `htmlbars-inline-precompile` with `ember-cli-htmlbars` import

#### Unit Test Updates
- Updated `tests/helpers/create-component.js` to work with Glimmer components
- Modified all unit component tests to wrap arguments in `args` object
- Fixed tests in:
  - `tests/unit/components/message-chat-test.js`
  - `tests/unit/components/link-to-username-test.js`
  - `tests/unit/components/channel-nav-test.js`

#### Assertion Updates
- Replaced `assert.equal` with `assert.strictEqual` (96 occurrences) for QUnit compatibility

### Configuration Updates
- Added ESLint flat config (`eslint.config.mjs`)
- Removed deprecated `.eslintrc.js`
- Updated ignore files (`.prettierignore`, `.stylelintignore`, `eslint.config.mjs`)
- Added `bail_on_first_failure: true` to `testem.js`
- Added `space-before-function-paren` ESLint rule
- Excluded markdown and HBS files from Prettier

### Dependencies Removed
- `ember-gestures` (incompatible with Ember 3.28+)
- `ember-hammertime` (incompatible with Ember 3.28+)
- Gesture support can be re-evaluated after upgrade completion

### Build Status
- ✅ Project builds successfully
- ✅ Linting passes
- ⚠️  Tests: Status pending (test suite currently hangs, investigating)

## Recent Fixes (Post-Upgrade)

### Component Structure Migration
- **Pod-to-Octane conversion**: Migrated all components from pod structure (component.js + template.hbs in subdirectories) to flat co-located structure (component-name.js + component-name.hbs in components/)
  - Used `ember-codemod-pod-to-octane` codemod
  - Fixes template resolution issues in Ember 6 integration tests
  - Both old pod directories and new flat files currently exist

### Module Import Issues
- **localforage**: Changed from default import to namespace import with fallback
  - `import * as localForageModule from 'localforage'`
  - `const localForage = localForageModule.default || localForageModule`
  - Fixed in `app/services/local-data.js`
  
- **@ember/string package**: Installed missing package for Ember 6.x
  - `pnpm add @ember/string`
  - Required for `capitalize` function used in controllers
  
- **htmlSafe import**: Moved from `@ember/string` to `@ember/template`
  - Fixed in `app/models/channel.js`
  - Fixed in `app/components/message-chat/component.js`
  
- **EmberArray methods in tests**: Converted `mapBy()` to native `map()`
  - Fixed in `tests/unit/services/coms-test.js`

### Test Infrastructure
- **createComponent helper**: Fixed for Glimmer components
  - Now passes args directly to component constructor
  - Fixed in `tests/helpers/create-component.js`

### Tests Fixed
- ✅ Unit | Service | sockethub-irc: All tests now pass
- ✅ Unit | Service | sockethub-xmpp: All tests now pass (8 tests)
- ✅ Unit | Service | coms: All tests now pass (8 tests)
- ✅ Unit | Service | local-data: All tests now pass
- ✅ Unit | Model | channel: htmlSafe tests now pass
- ✅ Unit | Component | message-chat: All 6 tests now pass

### Code Quality Fixes
- **date-headline component**: Fixed context binding in `later()` call for `scheduleUpdate` action
  - Changed from `later(this.scheduleUpdate, ...)` to `later(this, this.scheduleUpdate, ...)`
  - Ensures proper `this` context when callback executes

### Remaining Test Failures (23 total)
- Integration component rendering tests (21 failures) - mostly timeout/timing issues
- Unit | Model | base-channel: 2 failures related to message grouping and date headlines

### Post-Upgrade Reactivity Fix
- **Issue**: Channels, messages, and users not updating in templates after initial load
- **Root cause**: EmberArray (`A([])`) without `@tracked` doesn't trigger reactivity in Ember 6.4
- **Solution**: Replaced with `TrackedArray` from `tracked-built-ins` + `@tracked` decorator
  - Fixed in `app/services/coms.js`: `accounts` and `channels` arrays
  - Fixed in `app/models/base_channel.js`: `messages` and `userList` arrays
- **Result**: Channel list, messages, and user lists now update reactively ✅

### Ember Run Loop Migration
- **Issue**: `ember-lifeline` methods (`runTask`, `scheduleTask`) are deprecated in Ember 6.4+
- **Solution**: Replaced with native browser APIs and modern Ember patterns
  - `runTask()` → `setTimeout()` for delayed execution
  - `scheduleTask()` with 'actions' queue → `requestAnimationFrame()` for render-related timing
  - Proper cleanup with `clearTimeout()` and cancellation tokens
- **Files Updated**:
  - `app/controllers/base_channel.js`: Focus management after render
  - `app/routes/channel/index.js`: Scroll behavior on route transitions
  - All uses now follow modern async patterns ✅

### Built-in Form Components Migration
- **Issue**: `<Input>` component uses deprecated two-way binding
- **Solution**: Created reusable `on-update` modifier for one-way data flow
  - Replaces `<Input @value={{this.prop}} />` with `<input value={{this.prop}} {{on-update (fn (mut this.prop))}} />`
  - Automatically detects checkboxes vs text inputs
  - Proper event handling with 'change' for checkboxes, 'input' for text
- **Files Updated**:
  - `app/modifiers/on-update.js`: New modifier
  - `app/components/add-chat-account-irc.hbs` + `.js`
  - `app/components/add-chat-account-xmpp.hbs` + `.js`
  - `app/components/join-channel-irc.hbs` + `.js`
  - `app/components/join-channel-xmpp.hbs` + `.js`
  - `app/components/message-chat.hbs` + `.js`
- **Result**: All `no-builtin-form-components` linting errors resolved ✅

### Render Modifiers Migration
- **Issue**: `did-insert`, `did-update`, `will-destroy` modifiers are deprecated
- **Solution**: Created 6 custom modifiers using `ember-modifier` for proper lifecycle management
  1. **`keyboard-shortcuts`**: Handles keyboard shortcut binding/unbinding
  2. **`intersection-observer`**: Replaces scrolling-observer component logic
  3. **`periodic-update`**: Manages scheduled updates with proper cleanup
  4. **`on-render`**: Executes callbacks after element renders using `requestAnimationFrame()`
  5. **`on-channel-change`**: Reacts to channel prop changes
  6. **`on-users-change`**: Reacts to users prop changes
- **Components Refactored**:
  - `channel-nav`: Uses `keyboard-shortcuts` modifier
  - `message-input`: Removed `will-destroy`, uses event handlers
  - `scrolling-observer`: Now uses `templateOnly()` wrapper around `intersection-observer` modifier
  - `date-headline`: Uses `periodic-update` modifier
  - `channel-container`: Uses `on-render` and `on-channel-change` modifiers
  - `user-list`: Uses `on-users-change` modifier
- **Result**: All deprecated render modifiers removed, proper cleanup functions in place ✅

### Code Formatting Configuration
- **Issue**: Prettier conflicted with ESLint `space-before-function-paren` rule
- **Solution**: Configured Prettier to ignore JavaScript files (only format SCSS, etc.)
  - Added `*.js`, `*.mjs`, `*.cjs` to `.prettierignore`
  - ESLint handles JavaScript formatting with custom rules
  - Prettier formats SCSS and other non-JS files
- **Result**: Code style consistent with project preferences ✅

## Test Status
- ✅ All 133 tests passing (130 pass, 3 skipped)
- ✅ Linting passes (JS, HBS, format)
- ✅ Build succeeds
- ✅ App loads and runs correctly in browser

## Next Steps
1. Update to future Ember LTS versions as they're released
2. Continue monitoring for new deprecations in upcoming Ember versions
3. Consider performance optimizations now that modernization is complete

## Notes
- **Array reactivity**: Use `TrackedArray` from `tracked-built-ins` for reactive arrays that need to update templates
- EmberArray (`A([])`) without `@tracked` does NOT trigger re-renders in modern Ember
- `@tracked` decorator alone with native arrays doesn't track mutations (push/splice), only reassignments
- **Async patterns**: Use native browser APIs (setTimeout, requestAnimationFrame) instead of run loop
- **Form inputs**: Use custom `on-update` modifier for clean one-way data flow
- **Lifecycle management**: Create custom modifiers for setup/teardown instead of render modifiers
- Build succeeds with only SASS deprecation warnings (not critical)

## Ember 7.3 + Vite/Embroider Migration (2026)

### Upgrade Path
- Ember 6.4 (classic Broccoli build) → Ember 7.3 with Vite + Embroider ✅

### Build Pipeline
- Replaced `ember-cli-build.js` with `ember-cli-build.mjs`, using
  `@embroider/compat`'s `compatBuild` and `@embroider/vite`'s `buildOnce`.
- Added `vite.config.mjs`, `babel.config.mjs`, `postcss.config.mjs`, root
  `index.html` (moved from `app/index.html`) and `testem.cjs` (from `testem.js`).
- Added `app/config/environment.js`, which reads the build config via
  `@embroider/config-meta-loader`; deleted `jsconfig.json`.
- `app/app.js` now uses `Resolver.withModules(compatModules)` and the legacy
  inspector; `app/router.js` uses `@embroider/router`.
- `index.html` references absolute asset paths and `/@embroider/virtual/*`.
- Node requirement raised to `>= 20.19.0`.

### Package Manager: npm → pnpm
- Switched from npm to pnpm 10, pinned via `"packageManager": "pnpm@10.32.1"`
  in `package.json` so Corepack resolves the same version everywhere.
- Removed `package-lock.json`; added `pnpm-lock.yaml`.
- Scripts that shell out to other scripts now invoke `pnpm run` (`lint`,
  `lint:fix`, `test`, `preversion`, `version`).
- `.gitignore` ignores `/.pnpm-debug.log*`; `.prettierignore` already skipped
  `pnpm-lock.yaml`.
- `"pnpm": { "ignoredBuiltDependencies": ["@parcel/watcher"] }` documents that the
  transitive `@parcel/watcher` install script is intentionally skipped — its
  prebuilt platform binary is used instead, so no build is required.
- CI installs via `pnpm/action-setup@v4` (v10) with `actions/setup-node`'s
  `cache: pnpm` and `pnpm install --frozen-lockfile`.
- `README.md` and `AGENTS.md` commands were updated to pnpm.

### Styling
- SCSS kept: `app/styles/app.scss` is imported from `app/app.js`, so Vite
  compiles it with `sass` and then runs PostCSS.
- Tailwind v3 and autoprefixer run via `postcss.config.mjs`; removed
  `ember-cli-postcss`, `@csstools/postcss-sass` and `postcss-scss`.
- `app/styles/app.css` is an empty placeholder for Embroider's virtual app.css.

### Dependencies Replaced
- `ember-promise-modals` → local `modals` service + `ModalOverlay` component
  (the latest addon imported the `inject` export removed in Ember 7).
- `ember-concurrency` → guarded async action (v5 dropped the classic
  `task(function* () {})` syntax; there was a single usage).
- `ember-lifeline` → native `setTimeout`/`requestAnimationFrame` with destroy
  guards (the run-loop helpers are deprecated).
- `ember-keyboard-shortcuts` (mousetrap fork) → `app/utils/shortcut-matches.js`
  plus a rewritten `keyboard-shortcuts` modifier.
- `consistent-color-generation` (which pulled in `js-sha1`, whose
  `eval("require('crypto')")` tripped Rolldown's `[EVAL]` warning) →
  `app/utils/user-color.js`, implementing XEP-0392 with `@noble/hashes` SHA-1
  and `hsluv`. Output is unchanged.
- Removed unused deps: `ember-cached-decorator-polyfill`, `ember-body-class`,
  `ember-fetch`, `ember-sinon`, `@ember/render-modifiers`,
  `ember-cli-inline-content`, `inobounce`, `ember-cli-app-version`.
- Removed build-only deps: `ember-auto-import`, `loader.js`,
  `broccoli-asset-rev`, `ember-cli-sri`, `ember-cli-terser`,
  `ember-cli-inject-live-reload`, `ember-cli-clean-css`, `webpack`, stylelint.
- Upgraded across majors: `ember-autofocus-modifier` 3→8,
  `ember-truth-helpers` 3→5, `tracked-built-ins` 3→4, `ember-moment` 10→11,
  `@ember/test-waiters` 3→4, `ember-sinon-qunit` 6→7, `sinon` 21→22.

### Embroider Compatibility Fixes
- Replaced dynamic `{{component ...}}` invocations with static components in
  `add-chat-account.hbs`, `channel-container.hbs` and `join-channel.hbs`
  (Embroider requires statically analyzable components). The static rewrite in
  `channel-container.hbs` keeps branches for all message types
  (`message-chat-me`, `date-headline`, `message-chat`), so date headlines still
  render via `DateHeadline`.
- `app/utils/user-color.js` tolerates missing (`null`/`undefined`) identifiers,
  so a malformed message nickname can no longer abort the whole render.
- Fixed the `message-chat-me` import path and switched its template to `@message`.

### Tests
- `tests/index.html` and `tests/test-helper.js` updated to the new blueprint:
  tests are loaded via `import.meta.glob` and the helper exports `start()`.
- testem now runs against `dist` after `vite build --mode development`.
- `owner.factoryFor('component:...')` no longer resolves under Embroider, so the
  pure logic behind four component test files was extracted into utilities and
  tested directly: `format-message-content`, `irc-username`,
  `filter-room-config-data` and `relative-channel`. Removed
  `tests/helpers/create-component.js`.
- The QUnit recommended rules `require-expect`, `no-negated-ok` and
  `no-assert-equal-boolean` are intentionally left disabled to match previous
  behavior.

### Deploy
- `build-prod` now runs `rm -rf release/* && vite build --outDir release`.
- `release/` is not committed on feature branches; the `version` script rebuilds
  and commits it when a version is tagged. `public/sw.js` is unchanged (no-op).

### Test Status
- ✅ 150 tests: 147 pass, 3 skip, 0 fail
- ✅ Linting passes (JS, HBS, format)
- ✅ `pnpm build`, `pnpm build-prod` and `pnpm start` all succeed

### Notes / Follow-ups
- TypeScript not adopted (per project convention).
- Tailwind kept on v3; the v4 migration is a separate task.
- `ember-cli-htmlbars`' `hbs` is provided virtually by Embroider in the
  integration tests (it is not a direct dependency).
- The stale `Dockerfile` was removed rather than updated for the new build.
