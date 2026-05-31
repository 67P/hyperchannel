---
title: Announce Route Transitions to Screen Readers
impact: HIGH
impactDescription: Critical for screen reader navigation
tags: accessibility, a11y, routing, screen-readers
---

## Announce Route Transitions to Screen Readers

Announce page title changes and route transitions to screen readers so users know when navigation has occurred.

**Incorrect (no announcements):**

```javascript
// app/router.js
export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}
```

**Correct (using ember-a11y-refocus library - recommended):**

Use the [ember-a11y-refocus](https://github.com/ember-a11y/ember-a11y-refocus) library for robust route announcements, route transition focus management, and a bypass block (aka skip link).

```bash
pnpm add ember-a11y-refocus
```

Or with npm:

```bash
npm install ember-a11y-refocus
```

Use the addon by rendering `NavigationNarrator` in your application layout and ensuring your primary content has `id="main"`.

```handlebars
{{! app/templates/application.hbs }}
<header>
  <NavigationNarrator />
  {{! other header content }}
</header>

<main id='main'>
  {{outlet}}
</main>
```

If you are using GJS or GTS, import the component directly:

```glimmer-js
import { NavigationNarrator } from 'ember-a11y-refocus';

<template>
  <header>
    <NavigationNarrator />
  </header>

  <main id="main">
    {{outlet}}
  </main>
</template>
```

The addon ships minimal styles for the skip link and navigation message:

```javascript
// app/app.js or app/app.ts
import 'ember-a11y-refocus/styles/navigation-narrator.css';
```

If you need to customize which transitions count as a route change, pass a validator function to `NavigationNarrator`:

```javascript
// app/controllers/application.js
import Controller from '@ember/controller';
import { defaultValidator } from 'ember-a11y-refocus';

export default class ApplicationController extends Controller {
  myCustomValidator(transition) {
    if (transition.from?.name === 'special') {
      return false;
    }

    return defaultValidator(transition);
  }
}
```

```handlebars
{{! app/templates/application.hbs }}
<header>
  <NavigationNarrator @routeChangeValidator={{this.myCustomValidator}} />
</header>

<main id='main'>
  {{outlet}}
</main>
```

**Alternative: DIY approach with ARIA live regions:**

If you prefer not to use a library, you can implement route announcements yourself:

```javascript
// app/router.js
import EmberRouter from '@ember/routing/router';
import config from './config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {
  this.route('about');
  this.route('dashboard');
  this.route('posts', function () {
    this.route('post', { path: '/:post_id' });
  });
});
```

```javascript
// app/routes/application.js
import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class ApplicationRoute extends Route {
  @service router;

  constructor() {
    super(...arguments);

    this.router.on('routeDidChange', (transition) => {
      // Update document title
      const title = this.getPageTitle(transition.to);
      document.title = title;

      // Announce to screen readers
      this.announceRouteChange(title);
    });
  }

  getPageTitle(route) {
    // Get title from route metadata or generate it
    return route.metadata?.title || route.name;
  }

  announceRouteChange(title) {
    const announcement = document.getElementById('route-announcement');
    if (announcement) {
      announcement.textContent = `Navigated to ${title}`;
    }
  }
}
```

```glimmer-js
// app/routes/application.gjs
<template>
  <div
    id="route-announcement"
    role="status"
    aria-live="polite"
    aria-atomic="true"
    class="sr-only"
  ></div>

  {{outlet}}
</template>
```

```css
/* app/styles/app.css */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

Route announcements ensure screen reader users know when navigation occurs, improving the overall accessibility experience.

Reference: [Ember Accessibility - Page Titles](https://guides.emberjs.com/release/accessibility/page-template-considerations/)
