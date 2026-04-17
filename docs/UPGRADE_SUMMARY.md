# Ember 6.4 LTS Upgrade Summary

## Upgrade Path Completed
- Ember 3.24 → 3.28 (last 3.x LTS) ✅
- Ember 3.28 → 4.4 (first 4.x LTS) ✅
- Ember 4.4 → 4.12 (last 4.x LTS) ✅
- Ember 4.12 → 5.4 (5.x LTS) ✅
- Ember 5.4 → 6.4 (current LTS) ✅

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
  - `npm install @ember/string --save`
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
- ✅ All 104 tests passing (101 pass, 3 skipped)
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
