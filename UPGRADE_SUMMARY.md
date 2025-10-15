# Ember 6.4 LTS Upgrade Summary

## Upgrade Path Completed
- Ember 3.24 → 3.28 (last 3.x LTS) ✅
- Ember 3.28 → 4.4 (first 4.x LTS) ✅
- Ember 4.4 → 4.12 (last 4.x LTS) ✅
- Ember 4.12 → 5.4 (5.x LTS) ✅
- Ember 5.4 → 6.4 (current LTS) ✅

## Modernization Changes

### Array Handling (40+ occurrences)
- Removed `@tracked` decorator from EmberArray properties
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
- ⚠️  Tests running (some failures remain, mostly timing/integration issues)

## Next Steps
1. Address remaining component integration test failures
2. Fix timing-sensitive tests (date-headline, button-submit loading states)
3. Re-evaluate gesture support options
4. Consider updating other deprecated patterns as they're discovered

## Notes
- EmberArray methods are still supported in Ember 6.4 but avoided where conflicts with tracked properties exist
- `space.js` model intentionally kept with EmberArray as it doesn't conflict with reactivity
- Build succeeds with only SASS deprecation warnings (not critical)
