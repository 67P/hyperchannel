# Sections

This file defines all sections, their ordering, impact levels, and descriptions.
The section ID (in parentheses) is the filename prefix used to group rules.
When multiple prefixes map to one section, all supported prefixes are listed.

---

## 1. Route Loading and Data Fetching (route)

**Impact:** CRITICAL
**Description:** Efficient route loading and parallel data fetching eliminate waterfalls. Using route model hooks effectively and loading data in parallel yields the largest performance gains.

## 2. Build and Bundle Optimization (bundle)

**Impact:** CRITICAL
**Description:** Using Embroider with static build optimizations, route-based code splitting, and proper imports reduces bundle size and improves Time to Interactive.

## 3. Component and Reactivity Optimization (component, exports)

**Impact:** HIGH
**Description:** Proper use of Glimmer components, modern file conventions, tracked properties, and avoiding unnecessary recomputation improves rendering performance.

## 4. Accessibility Best Practices (a11y)

**Impact:** HIGH
**Description:** Making applications accessible is critical. Use ember-a11y-testing, semantic HTML, proper ARIA attributes, and keyboard navigation support.

## 5. Service and State Management (service)

**Impact:** MEDIUM-HIGH
**Description:** Efficient service patterns, proper dependency injection, and state management reduce redundant computations and API calls.

## 6. Template Optimization (template, helper)

**Impact:** MEDIUM
**Description:** Optimizing templates with proper helpers, avoiding expensive computations in templates, and using {{#each}} efficiently improves rendering speed.

## 7. Performance Optimization (performance)

**Impact:** MEDIUM
**Description:** Performance-focused rendering and event handling patterns help reduce unnecessary work in hot UI paths.

## 8. Testing Best Practices (testing)

**Impact:** MEDIUM
**Description:** Modern testing patterns, waiters, and abstraction utilities improve test reliability and maintainability.

## 9. Tooling and Configuration (vscode)

**Impact:** MEDIUM
**Description:** Consistent editor setup and tooling recommendations improve team productivity and reduce environment drift.

## 10. Advanced Patterns (advanced)

**Impact:** MEDIUM-HIGH
**Description:** Modern Ember patterns including Resources for lifecycle management, ember-concurrency for async operations, modifiers for DOM side effects, helpers for reusable logic, and comprehensive testing patterns with render strategies.
