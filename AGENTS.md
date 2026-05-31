# Agent Guide for Hyperchannel

Welcome, AI Agent! This document provides essential context and rules for working on the Hyperchannel codebase. Please review this carefully before making changes or planning your tasks.

## 1. Project Overview
- **Name**: Hyperchannel
- **Type**: Unhosted client application for the Kosmos Chat project.
- **Key Technologies**: Ember.js (modern, Octane/Glimmer), Sockethub (WebSockets/ActivityStreams), remoteStorage.
- **Node.js Version**: `>= 18`

## 2. Technical Stack & Conventions
- **Ember.js**: This project uses modern Ember. Expect to see `@glimmer/component`, `@tracked`, and `@action` decorators instead of classic Ember constructs.
- **Component Structure**: Components are colocated. You will find both `component-name.js` and `component-name.hbs` side-by-side in the `app/components/` directory.
- **Ember Data IS NOT USED**: This is a critical distinction for this project. 
  - The application manages models manually as plain classes with `@tracked` properties (see `app/models/`).
  - **Testing Models**: Do not use `moduleForModel` or Ember Data-specific testing setups. Use standard `setupTest(hooks)` from `ember-qunit`. (Reference `tests/unit/models/channel-test.js` or `base-channel-test.js` for proper testing examples).
  - Do not try to inject or use the `store` service.

## 3. Workflow & Commands
When operating on this codebase, utilize the following `npm` scripts:
- **Install dependencies**: `npm install`
- **Serve**: `npm start` (Runs development server on port 4200)
- **Test**: `npm test` (Runs tests in the terminal via QUnit). For TDD, use `npm test -- --server`.
- **Linting & Formatting**: 
  - `npm run lint` (Checks JS, HBS, and Formatting via Prettier/ESLint/Template Lint)
  - `npm run lint:fix` (Fixes auto-fixable issues)
- **Building**: `npm run build` (development) or `npm run build-prod` (production)

## 4. Guidelines for Making Changes
- **Search First**: Before implementing features, always `glob` and `grep` to understand existing utilities, services (like `coms`), and patterns. 
- **Mimic Existing Style**: Look closely at how similar components, routes, or services are implemented and match their architectural and formatting choices.
- **Verify with Tests**: Always ensure the test suite (`npm test`) passes before considering a task complete. When adding new functionality, add unit or acceptance tests that align with existing patterns.
- **Linting Rules**: Before concluding your task, run `npm run lint:fix` to ensure your code matches the project's rigorous style guidelines and passes automated CI checks.

## 5. Helpful Locations
- `app/components/`: Colocated Glimmer components (UI building blocks).
- `app/models/`: Custom, plain-JavaScript/Glimmer-tracked models.
- `app/services/`: Services connecting to Sockethub, remoteStorage, and managing state.
- `tests/`: Standard QUnit test suites divided into `unit`, `integration`, and `acceptance`. 
