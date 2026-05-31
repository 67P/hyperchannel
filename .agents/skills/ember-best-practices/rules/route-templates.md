---
title: Use Separate Route and Template Files
impact: MEDIUM-HIGH
impactDescription: Better code organization and maintainability
tags: routes, templates, gjs, file-conventions
---

## Use Separate Route and Template Files

Keep route logic in `app/routes/*.js` and route templates in `app/templates/*.gjs`. Route classes imported from `@ember/routing/route` do not support inline `<template>` blocks.

**Incorrect (inline template inside a route class):**

```glimmer-js
// app/routes/posts.gjs
import Route from '@ember/routing/route';

export default class PostsRoute extends Route {
  model() {
    return this.store.request({ url: '/posts' });
  }

  <template>
    <h1>Posts</h1>
    <ul>
      {{#each @model as |post|}}
        <li>{{post.title}}</li>
      {{/each}}
    </ul>

    {{outlet}}
  </template>
}
```

**Correct (separate route module and template file):**

```javascript
// app/routes/posts.js
import Route from '@ember/routing/route';

export default class PostsRoute extends Route {
  model() {
    return this.store.request({ url: '/posts' });
  }
}
```

```glimmer-js
// app/templates/posts.gjs
<template>
  <h1>Posts</h1>
  <ul>
    {{#each @model as |post|}}
      <li>{{post.title}}</li>
    {{/each}}
  </ul>

  {{outlet}}
</template>
```

**With a separate template file for route UI:**

```javascript
// app/routes/posts.js
import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class PostsRoute extends Route {
  @service store;

  model() {
    return this.store.request({ url: '/posts' });
  }
}
```

```glimmer-js
// app/templates/posts.gjs
<template>
  <div class="posts-page">
    <h1>Posts</h1>

    {{#if @model}}
      <ul>
        {{#each @model as |post|}}
          <li>{{post.title}}</li>
        {{/each}}
      </ul>
    {{/if}}

    {{outlet}}
  </div>
</template>
```

**Template-only routes:**

```glimmer-js
// app/templates/about.gjs
<template>
  <div class="about-page">
    <h1>About Us</h1>
    <p>Welcome to our application!</p>
  </div>
</template>
```

Keeping route classes and route templates in their conventional files matches Ember's supported routing model and makes examples easier to apply in real apps.

Reference: [Ember Routes](https://guides.emberjs.com/release/routing/)
