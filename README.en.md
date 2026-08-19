# MirrorState

[English](./README.en.md) | [中文](./README.md)

A lightweight, framework-agnostic reactive state management library that theoretically supports all frameworks, letting state return to the framework.

[![npm version](https://img.shields.io/npm/v/mirrorstate.svg)](https://www.npmjs.com/package/mirrorstate)
[![license](https://img.shields.io/npm/l/mirrorstate.svg)](https://github.com/hardworking-mister/mirrorstate/blob/main/LICENSE)

## ✨ Features

* 🚀 **Framework-agnostic** - One API works with all frameworks
* 📦 **Ultra-lightweight** - Only 2KB core, zero dependencies
* 🎯 **On-demand updates** - Only components subscribed to state changes re-render
* 🔧 **Middleware system** - Onion model architecture
* 💪 **TypeScript support** - Full type inference
* 🎨 **Flexible usage** - Works for both reactive UI state and non-reactive data

## 📦 Installation

```bash
npm install mirrorstate
# or
yarn add mirrorstate
# or
pnpm add mirrorstate
```

## 🚀 Quick Start

### Usage in React

```tsx
import { createStore, generateId } from "mirrorstate"
import { useEffect, useState } from "react"

// Create custom hook
const useCounter = () => {
  // Use useState lazy init to keep generateId()'s return value stable across re-renders
  // ⚠️ For SSR scenarios, switch to React's useId() — generateId produces different values on server/client, causing hydration mismatch
  const [componentId] = useState(() => generateId())
  const [count, setCount] = useState(0)
  const [text, setText] = useState("hello")

  const store = createStore({
    componentId,
    storeName: "counter",
    setMethod: {
      count: (v) => v ? setCount : count,
      text: (v) => v ? setText : text
    }
  })

  useEffect(() => {
    return () => store.cleanup()
  }, [])

  return store
}

// Use in component
function Counter() {
  const { count, text } = useCounter()

  return (
    <div>
      <p>{count()}</p>
      <button onClick={() => count(v => v + 1)}>+1</button>
      <button onClick={() => count(() => 0)}>Reset</button>

      <p>{text()}</p>
      <input value={text()} onChange={(e) => text(e.target.value)} />
    </div>
  )
}
```

### Usage in Vue

```js
import {
    createStore,
    generateId
} from "mirrorstate"
import {
    ref,
    onUnmounted
} from "vue"

const useCounter = () => {
    // Vue setup runs only once per component instance, so generateId() can be called directly
    // ⚠️ For SSR scenarios, ensure server/client produce the same id — use Nuxt's useId() or pin the id in onServerPrefetch
    const componentId = generateId()
    const count = ref(0)
    const text = ref("hello")

    const setCount = (value) => {
        count.value = value
    }
    const setText = (value) => {
        text.value = value
    }

    const store = createStore({
        componentId,
        storeName: "counter",
        setMethod: {
            count: (v) => v ? setCount : count.value,
            text: (v) => v ? setText : text.value
        }
    })

    onUnmounted(() => {
        store.cleanup()
    })

    return store
}
```

```vue
<script setup>
// Use in component
const { count, text } = useCounter()
</script>

<template>
  <div>
    <p>{{ count() }}</p>
    <button @click="count(v => v + 1)">+1</button>
    <button @click="count(() => 0)">Reset</button>

    <p>{{ text() }}</p>
    <input :value="text()" @input="text($event.target.value)" />
  </div>
</template>
```

### Generating the componentId

`createStore` requires a `componentId` that is **stable and unique** for the lifetime of the component instance — it's used internally to isolate subscription sets per component in a Map. The library exports a `generateId()` helper:

```typescript
import { generateId } from "mirrorstate"

// Uses crypto.randomUUID() by default, falls back to timestamp + random when unavailable
const id = generateId()  // e.g. "7f2a3c1b-8d4e-4f6a-9b3c-1e2d3f4a5b6c"
```

Best practices per scenario:

| Scenario | Recommended | Notes |
|---|---|---|
| React CSR | `const [componentId] = useState(() => generateId())` | useState lazy init keeps id stable across renders |
| React SSR / Next.js | `import { useId } from "react"; const componentId = useId()` | React 18+ useId is SSR-safe, server/client produce the same id |
| Vue 3 CSR | `const componentId = generateId()` | setup runs once, direct call is fine |
| Vue 3 SSR / Nuxt | `const componentId = useId()` (Nuxt 3.5+) | Nuxt's built-in useId solves SSR consistency |
| Global singleton store | `const componentId = "global-route-store"` | Fixed string for cross-component non-reactive state |

> 💡 **Rule of thumb**: For CSR apps, use `generateId()` with a framework state primitive. For SSR apps, prefer the framework's built-in `useId()` to avoid hydration mismatch.

## 📖 Core Concepts

### ⚠️ Note on React Strict Mode

This library uses a "mirror state back to framework primitives" design. Under React 18+ Strict Mode, the stale-closure fallback logic may be double-invoked on first render, causing a one-frame flash. It is recommended to use without Strict Mode, or disable Strict Mode in production.

### createStore Configuration

```typescript
interface CreateStoreOptions<T> {
  // Required: Unique component ID for state isolation
  componentId: string
  
  // Required: Store name
  storeName: string
  
  // Required: State definition
  setMethod: {
    [K in keyof T]: (v?: any) => any
  }
  
  // Optional: Middleware array
  middlewares?: Middleware[]
}
```

### Design Philosophy of setMethod

setMethod uses functional design, distinguishing read/write by arguments:

```typescript
setMethod: {
  // Get/init value when argument is falsy
  // Subscribe when argument is truthy
  count: (v) => v ? setCount : count,
  
  // Functional update (must pass a function; passing a plain value throws)
  count(v => v + 1) 
  // Read (no arguments)
  count()
}
```

> ⚠️ **Updates only accept a function updater.** `count(100)` (passing a plain value) will throw — use `count(() => 100)` or `count(v => 100)` instead. This prevents silent no-ops.

### Middleware

Middleware allows you to run custom logic before and after state changes. **Middlewares must call `next()` synchronously** — calling it after an `await` is not supported. This ensures hydration during `createStore` initialization completes synchronously.

```typescript
import type { Middleware } from "mirrorstate"

// Logger middleware
const logger: Middleware = (ctx, next) => {
  console.log(`[${ctx.storeName}] ${ctx.key}:`, ctx.value)
  next()
  console.log(`[${ctx.storeName}] ${ctx.key} updated`)
}

// Persistence middleware (the library ships plugin.persistent; this is just an example)
const persist: Middleware = (ctx, next) => {
  next()
  localStorage.setItem(ctx.storeName, JSON.stringify(ctx.store))
}

// Use middleware
const store = createStore({
  componentId: useId(),
  storeName: "user",
  middlewares: [logger, persist],
  setMethod: {
    name: (v) => v ? setName : name
  }
})
```

## 🎯 Advanced Usage

### 1. Global Route State (Non-reactive)

```typescript
// store/route.ts
import { createStore } from "mirrorstate"

export const useRouteStore = () => {
  // Fixed ID for global uniqueness
  const componentId = "global-route-store"
  
  // Plain variables, no view re-renders
  let currentRoute = '/'
  let isLogin = false
  let permissions = new Set<string>()
  
  const setCurrentRoute = (route: string) => { currentRoute = route }
  const setIsLogin = (status: boolean) => { isLogin = status }
  const setPermissions = (perms: string[]) => { permissions = new Set(perms) }
  
  const store = createStore({
    componentId,
    storeName: "route",
    setMethod: {
      currentRoute: (v) => v ? setCurrentRoute : currentRoute,
      isLogin: (v) => v ? setIsLogin : isLogin,
      permissions: (v) => v ? setPermissions : permissions,
      hasPermission: (perm: string) => () => permissions.has(perm)
    }
  })
  
  return store
}

// Use in route guard
router.beforeEach((to, from, next) => {
  const { isLogin, hasPermission } = useRouteStore()
  
  if (to.meta.requiresAuth && !isLogin()) {
    next('/login')
    return
  }
  
  if (to.meta.permission && !hasPermission(() => to.meta.permission)) {
    next('/403')
    return
  }
  
  next()
})
```

### 2. Batch Update

```typescript
const { batch } = useUser()

// Update multiple states at once
batch({
  name: 'John Doe',
  age: 25,
  email: 'john@example.com'
})
```

### 3. Inter-component Communication

```typescript
// Component A
function Sender() {
  const { count } = useCounter()
  
  return <button onClick={() => count(() => 100)}>Send</button>
}

// Component B (auto-updates)
function Receiver() {
  const { count } = useCounter()  // Same storeName
  
  return <div>{count()}</div>  // Auto-re-renders when A updates
}
```

## 🛠 API Reference

### createStore(options)

Create a state store.

### Store Instance Methods

| Method | Description |
|--------|-------------|
| `state()` | Get state value |
| `state(fn)` | Functional update |
| `batch(object)` | Batch update multiple states |
| `cleanup()` | Clean up subscriptions and state |

### Middleware Context

```typescript
interface Context {
  storeName: string  // Store name
  key: string        // Updated key
  store: any         // Full store object
  value: any         // New value
  subscribeStore: Map<string, Set<Function>>  // Subscribers
}
```

## ⚡ Performance Optimization

1. **On-demand subscription**: Only states actually used by components are subscribed
2. **Precise updates**: State changes notify only subscribed components
3. **Auto-cleanup**: Unsubscribe automatically when components unmount
4. **Non-reactive support**: Use plain variables for data that doesn’t trigger view updates (e.g., route state)

## 🤝 Contributing

Contributions and suggestions are welcome!

## 📄 License

[MIT](LICENSE) © 2026
