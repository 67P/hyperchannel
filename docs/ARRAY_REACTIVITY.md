# Array Reactivity in Modern Ember (6.4)

## The Problem

In Ember 6.4 (Octane+), arrays don't automatically trigger template re-renders when mutated. There are three approaches, each with different use cases:

## Solution 1: TrackedArray (Recommended for Mutable Arrays)

Use `TrackedArray` from `tracked-built-ins` for arrays that will be mutated with `push()`, `splice()`, etc.

```javascript
import { tracked } from '@glimmer/tracking';
import { TrackedArray } from 'tracked-built-ins';

export default class MyService extends Service {
  @tracked channels = new TrackedArray([]);
  
  addChannel(channel) {
    this.channels.push(channel);  // ✅ Triggers re-render
  }
  
  removeChannel(channel) {
    const index = this.channels.indexOf(channel);
    this.channels.splice(index, 1);  // ✅ Triggers re-render
  }
}
```

**When to use:**
- Service properties that store collections (`accounts`, `channels`, `messages`)
- Model properties that are mutated directly (`userList`, `messages`)
- Any array where you'll use `push()`, `splice()`, `pop()`, `shift()`, `unshift()`

## Solution 2: @tracked with Reassignment

Use plain `@tracked` with native arrays if you always reassign (not mutate):

```javascript
import { tracked } from '@glimmer/tracking';

export default class MyComponent extends Component {
  @tracked items = [];
  
  addItem(item) {
    this.items = [...this.items, item];  // ✅ Triggers re-render
  }
  
  removeItem(item) {
    this.items = this.items.filter(i => i !== item);  // ✅ Triggers re-render
  }
  
  // This DOES NOT work:
  wrongWay(item) {
    this.items.push(item);  // ❌ Does NOT trigger re-render
  }
}
```

**When to use:**
- Component state that changes infrequently
- When you prefer immutable patterns

## Solution 3: @cached Getters (For Derived Data)

Use `@cached` for computed/derived arrays:

```javascript
import { tracked, cached } from '@glimmer/tracking';

export default class MyService extends Service {
  @tracked channels = new TrackedArray([]);
  
  @cached
  get sortedChannels() {
    return [...this.channels].sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  }
  
  @cached
  get activeChannels() {
    return this.channels.filter(ch => ch.connected);
  }
}
```

**When to use:**
- Filtered, sorted, or mapped versions of tracked data
- Any computation based on tracked properties
- Read-only arrays

## What NOT to Do

### ❌ EmberArray without @tracked
```javascript
import { A } from '@ember/array';

export default class MyService extends Service {
  channels = A([]);  // ❌ No reactivity in Ember 6.4
}
```

### ❌ @tracked with EmberArray
```javascript
import { A } from '@ember/array';
import { tracked } from '@glimmer/tracking';

export default class MyService extends Service {
  @tracked channels = A([]);  // ❌ Doesn't work together
}
```

### ❌ Plain arrays without @tracked
```javascript
export default class MyService extends Service {
  channels = [];  // ❌ No reactivity at all
}
```

### ❌ @tracked with plain array mutations
```javascript
import { tracked } from '@glimmer/tracking';

export default class MyService extends Service {
  @tracked channels = [];
  
  addChannel(channel) {
    this.channels.push(channel);  // ❌ Does NOT trigger re-render
  }
}
```

## Migration Checklist

When upgrading from Ember 3.x to 6.4:

1. **Identify mutable arrays** in services and models
2. **Replace EmberArray** with TrackedArray:
   - Change `import { A } from '@ember/array'` to `import { TrackedArray } from 'tracked-built-ins'`
   - Change `arrayName = A([])` to `@tracked arrayName = new TrackedArray([])`
3. **Update methods** to use native JavaScript:
   - `pushObject(item)` → `push(item)`
   - `removeObject(item)` → `splice(indexOf(item), 1)`
4. **Add @cached** to computed/derived arrays
5. **Test** that templates update when arrays change

## References

- [tracked-built-ins documentation](https://github.com/tracked-tools/tracked-built-ins)
- [Ember Octane Reactivity Guide](https://guides.emberjs.com/release/in-depth-topics/autotracking-in-depth/)
