---
title: Use ember-a11y-testing for Automated Checks
impact: HIGH
impactDescription: Catch 30-50% of a11y issues automatically
tags: accessibility, a11y, testing, ember-a11y-testing
---

## Use ember-a11y-testing for Automated Checks

Integrate ember-a11y-testing into your test suite to automatically catch common accessibility violations during development. This addon uses axe-core to identify issues before they reach production.

**Incorrect (no accessibility testing):**

```glimmer-js
// tests/integration/components/user-form-test.js
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, fillIn, click } from '@ember/test-helpers';
import UserForm from 'my-app/components/user-form';

module('Integration | Component | user-form', function (hooks) {
  setupRenderingTest(hooks);

  test('it submits the form', async function (assert) {
    await render(<template><UserForm /></template>);
    await fillIn('input', 'John');
    await click('button');
    assert.ok(true);
  });
});
```

**Correct (with a11y testing):**

```glimmer-js
// tests/integration/components/user-form-test.js
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, fillIn, click } from '@ember/test-helpers';
import a11yAudit from 'ember-a11y-testing/test-support/audit';
import UserForm from 'my-app/components/user-form';

module('Integration | Component | user-form', function (hooks) {
  setupRenderingTest(hooks);

  test('it submits the form', async function (assert) {
    await render(<template><UserForm /></template>);

    // Automatically checks for a11y violations
    await a11yAudit();

    await fillIn('input', 'John');
    await click('button');
    assert.ok(true);
  });
});
```

**Setup (install and configure):**

```bash
ember install ember-a11y-testing
```

```javascript
// tests/test-helper.js
import { setupGlobalA11yHooks } from 'ember-a11y-testing/test-support';

setupGlobalA11yHooks(); // Runs on every test automatically
```

### Leave All Rules Enabled

Keep the default ember-a11y-testing and axe-core rules turned on. Avoid disabling rules globally or excluding specific rules to bypass failures without a documented remediation plan.

When teams suppress accessibility rules without a time-boxed remediation plan, they hide real defects, accumulate technical debt, and make regressions harder to detect. A skipped rule can allow a serious accessibility defect to ship to production, especially for problems involving forms, keyboard access, focus management, semantics, or ARIA usage.

If you must suppress a rule temporarily, treat it as an exception: document why it is needed, scope it as narrowly as possible, and create follow-up work to restore the rule quickly.

ember-a11y-testing catches issues like missing labels, insufficient color contrast, invalid ARIA, and keyboard navigation problems automatically.

Reference: [ember-a11y-testing](https://github.com/ember-a11y/ember-a11y-testing)
