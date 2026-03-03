# MirrorState

[English](./README.en.md) | [中文](./README.md)

---

**Component-Autonomous State Management · Let the Framework Do What It Does Best**

Bug reports: hardworking-mister@qq.com

## 🎯 Design Philosophy

**MirrorState** is not just another state management library—it's a bridge that enables **framework-native state** to be shared across components.

* **Component Autonomy** - State inherently belongs to components but can be shared between them
* **Zero Learning Curve** - Use the framework APIs you already know, no need to learn a new reactivity system
* **Framework Agnostic** - Theoretically adaptable to any framework with a component concept
* **Type Safety** - Full TypeScript support

## 📦 Installation

```bash
npm install mirrorstate
# or
yarn add mirrorstate
# or
pnpm add mirrorstate
```

## 🚀 Quick Start

### Vue 3

```vue
// store/user.ts
import { cleanup, useCreateStore } from "mirrorstate"
import { onUnmounted, ref, useId } from "vue"

export const useUser = () => {
  const componentId = useId()

  onUnmounted(() => {
    cleanup(componentId)
  })

  const user = useCreateStore({
    storeName: "user",
    componentId,
    useManager: () => {
      const count = ref(0)
      const display = ref(true)
      
      return {
        // Same function, parameter determines behavior
        count: (value) => value !== undefined ? count.value = value : count.value,
        display: (value) => value !== undefined ? display.value = value : display.value
      }
    }
  })

  return user
}
```

```vue
// Component A - Display
<script setup>
import { useUser } from '../store/user'

const { count } = useUser()
</script>

<template>
  <div>{{ count() }}</div>
</template>

// Component B - Modify
<script setup>
import { useUser } from '../store/user'

const { count } = useUser()

const click = () => {
  count(count() + 1)  // Read current value, add 1, then update
}
</script>

<template>
  <button @click="click">{{ count() }}</button>
</template>
```

### React

```tsx
// store/user.ts
import { cleanup, useCreateStore } from "mirrorstate"
import { useId, useState, useEffect } from "react"

export const useUser = () => {
  const componentId = useId()
  
  // React requires manual cleanup
  useEffect(() => {
    return () => cleanup(componentId)
  }, [])

  const user = useCreateStore({
    componentId,
    storeName: "user",
    useManager: () => {
      const [count, setCount] = useState(0)
      
      return {
        setCount: (value) => {
          if (value !== undefined) setCount(value)
          return count  // Returns current value when called without args
        }
      }
    }
  })
  
  return user
}
```

```tsx
// Component A - Display
import { useUser } from "../store/user"

const Test = () => {
  const { setCount } = useUser()
  return <div>{setCount()}</div>  // Read
}

// Component B - Modify
const Hello = () => {
  const { setCount } = useUser()
  const count = setCount()  // Read current value
  
  return (
    <button onClick={() => {
      setCount(setCount() + 1)  // Read current value, add 1, then update
    }}>
      {count}
    </button>
  )
}
```

## 📖 API

### useCreateStore(props)

The core method for creating shared state.

```typescript
interface Initial<T> {
  storeName: string      // Unique store identifier
  componentId: string    // Component ID (for cleanup)
  middlewares?: Middleware[] // Middleware
  useManager: () => T    // Factory function returning object of functions
}

function useCreateStore<T extends Record<string, Function>>(
  props: Initial<T>
): State<T>
```

### cleanup(componentId)

Cleans up component-related subscriptions.

```typescript
function cleanup(componentId: string): void
```

### batch(storeName, value?)

Batch updates state without triggering middleware.

```typescript
function batch<T>(storeName: string, value?: T): T
```

### Middleware

Supports custom middleware for logging, persistence, debugging, etc.

```typescript
export type Context = {
    /**
     * - Trigger type: set-update, get-retrieval
     */
    type: 'set' | 'get'
    /**
     * - Store name
     */
    storeName: string
    /**
     * - Key of the current value
     */
    key: string
    /**
     * - Current value
     */
    value?: any
    /**
     * - New value when setting
     */
    newValue?: any
}

const logger = async (ctx: Context, next) => {
  console.log(`${ctx.type}:`, ctx)
  // Custom middleware must actively call next before return
  // Code above next executes before update
  await next()
  // Code below next executes after update
}
```

## 🎨 Core Concepts

### Function as API

```typescript
// A single function handles both get/set
const count = (value) => {
  if (value === undefined) {
    return currentValue  // getter
  }
  currentValue = value   // setter
  return value
}

// Usage
count()      // Read
count(10)    // Write
count(count() + 1)  // Read and write
```

### Component Autonomy

State is defined within components but stored globally:

```typescript
// Every component can access the same count
Component A: count()  // 0
Component B: count(5) // Write
Component A: count()  // 5 (automatically synced)
```

### Cross-Framework Workflow

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  Vue Component│    │  MirrorState │    │React Component│
│  ref reactive │ ←→ │  Store/PubSub│ ←→ │ useState    │
└─────────────┘    └──────────────┘    └─────────────┘
```

## 🔧 Advanced Usage

### Custom Middleware

```typescript
// Persistence middleware
const persist: Middleware = async (ctx, next) => {
  if (ctx.type === 'set') {
    localStorage.setItem(`${ctx.storeName}-${ctx.key}`, JSON.stringify(ctx.newValue))
  }
  await next()
}

// Usage
useCreateStore({
  storeName: "user",
  middlewares: [persist, logger],
  // ...
})
```

### Batch Updates

```typescript
import { batch } from "mirrorstate"

batch('user', {
  count: 10,
  display: false
})
```

## 🤔 Why Not Pinia/Zustand/Redux?

| Feature | MirrorState | Pinia | Zustand | Redux |
|---------|-------------|-------|---------|-------|
| **Learning Curve** | 0 (use framework APIs) | Medium | Low | High |
| **Reactivity** | Framework Native | Self-implemented | Self-implemented | Self-implemented |
| **Bundle Size** | ~2KB | ~10KB | ~3KB | ~12KB |
| **Framework Coupling** | None (adapter layer) | Vue-specific | React-first | Framework-agnostic |
| **Component Autonomy** | ✅ Inherent | ❌ Global | ❌ Global | ❌ Global |

## 📝 Notes

1. **Functions must return the current value** (when called without parameters)
2. **storeName must be globally unique**

## 🤝 Contributing

PRs welcome! Especially needed:
* Adapters for more frameworks (Svelte, Solid, Angular)
* Test cases
* Documentation improvements

## 📄 License

MIT © 2026 hardworking-mister
