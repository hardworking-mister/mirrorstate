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
import { createStore } from "mirrorstate"
import { useId, useEffect } from "react"

// Create custom hook
const useCounter = () => {
  const componentId = useId()
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
    createStore
} from "mirrorstate"
import {
    ref,
    onUnmounted,
    useId
} from "vue"

const useCounter = () => {
    const componentId = useId()
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

## 📖 Core Concepts

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
  
  // Functional update
  count(v => v + 1) 
  // Read (no arguments)
  count()
}
```

### Middleware

Middleware allows you to run custom logic before and after state changes:

```typescript
import type { Middleware } from "mirrorstate"

// Logger middleware
const logger: Middleware = async (ctx, next) => {
  console.log(`[${ctx.storeName}] ${ctx.key}:`, ctx.value)
  await next()
  console.log(`[${ctx.storeName}] ${ctx.key} updated`)
}

// Persistence middleware
const persist: Middleware = async (ctx, next) => {
  await next()
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
  
  return <button onClick={() => count(100)}>Send</button>
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
