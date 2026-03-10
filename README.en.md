# MirrorState

[English](./README.en.md) | [中文](./README.md)

A lightweight, framework-agnostic reactive state management library supporting React and Vue, allowing you to manage application state with a unified API.

[![npm version](https://img.shields.io/npm/v/mirrorstate.svg)](https://www.npmjs.com/package/mirrorstate)
[![license](https://img.shields.io/npm/l/mirrorstate.svg)](https://github.com/hardworking-mister/mirrorstate/blob/main/LICENSE)

## ✨ Features

* 🚀 **Framework Agnostic** - Same API supports both React and Vue
* 📦 **Lightweight** - Core code is only 2KB, zero dependencies
* 🎯 **On-Demand Updates** - Only components subscribed to state changes re-render
* 🔧 **Middleware Mechanism** - Supports logging, persistence, time travel, and other extensions
* 💪 **TypeScript Support** - Full type inference
* 🧹 **Automatic Cleanup** - Automatically cleans up subscriptions when components unmount
* 🎨 **Flexible Usage** - Can be used for reactive UI state as well as non-reactive data

## 📦 Installation

```bash
npm install mirrorstate
# or
yarn add mirrorstate
# or
pnpm add mirrorstate
```

## 🚀 Quick Start

### Usage with React

```tsx
import { createStore } from "mirrorstate"
import { useId, useEffect } from "react"

// Create a custom hook
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

// Use in a component
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

### Usage with Vue

```vue
<script setup>
import { createStore } from "mirrorstate"
import { ref, onUnmounted } from "vue"

// Create a custom hook
const useCounter = () => {
  const componentId = Symbol('counter')
  const count = ref(0)
  const text = ref("hello")
  
  const setCount = (value) => { count.value = value }
  const setText = (value) => { text.value = value }

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

// Use in a component
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
  // Required: Unique component identifier for state isolation
  componentId: string
  
  // Required: Store name
  storeName: string
  
  // Required: State definitions
  setMethod: {
    [K in keyof T]: (v?: any) => any
  }
  
  // Optional: Middleware array
  middlewares?: Middleware[]
}
```

### setMethod Philosophy

setMethod uses a functional design that determines read or write based on parameters:

```typescript
setMethod: {
  // Returns current value when no parameter is passed (read)
  // Returns setter function when parameter is passed (write)
  count: (v) => v ? setCount : count,
  
  // Supports functional updates
  count: (v) => v ? setCount : count  
  // count(v => v + 1) is handled automatically
}
```

### Middleware

Middleware allows you to execute custom logic before and after state changes:

```typescript
import type { Middleware } from "mirrorstate"

// Logger middleware
const logger: Middleware = async (ctx, next) => {
  console.log(`[${ctx.storeName}] ${ctx.key}:`, ctx.value)
  await next()
  console.log(`[${ctx.storeName}] ${ctx.key} update completed`)
}

// Persistence middleware
const persist: Middleware = async (ctx, next) => {
  await next()
  localStorage.setItem(ctx.storeName, JSON.stringify(ctx.store))
}

// Using middleware
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

### 1. Global Route State (Non-Reactive)

```typescript
// store/route.ts
import { createStore } from "mirrorstate"

export const useRouteStore = () => {
  // Use a fixed ID to ensure global uniqueness
  const componentId = "global-route-store"
  
  // Plain variables, don't trigger view updates
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

// Use in route guards
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

### 2. Batch Updates

```typescript
const { batch } = useUser()

// Update multiple states at once
batch({
  name: 'John Doe',
  age: 25,
  email: 'john@example.com'
})
```

### 3. Component Communication

```typescript
// Component A
function Sender() {
  const { count } = useCounter()
  
  return <button onClick={() => count(100)}>Send</button>
}

// Component B (auto-updates)
function Receiver() {
  const { count } = useCounter()  // Use the same storeName
  
  return <div>{count()}</div>  // Automatically re-renders when A updates
}
```

## 🛠 API Reference

### createStore(options)

Creates a state store.

### Store Instance Methods

| Method | Description |
|------|------|
| `state()` | Get state value |
| `state(fn)` | Functional update |
| `batch(object)` | Batch update multiple states |
| `cleanup()` | Clean up subscriptions and state |

### Middleware Context

```typescript
interface Context {
  storeName: string  // Store name
  key: string        // Key being updated
  store: any         // Entire store object
  value: any         // New value
  subscribeStore: Map<string, Set<Function>>  // Subscriber information
}
```

## ⚡ Performance Optimization

1. **On-Demand Subscription**: Subscription relationships are only established for states actually used by components
2. **Precise Updates**: State changes only notify components that have actually subscribed
3. **Automatic Cleanup**: All subscriptions are automatically cancelled when components unmount
4. **Non-Reactive Support**: Use plain variables for data that doesn't need to trigger view updates (like route state)

## 🤝 Contributing Guide

Contributions and suggestions are welcome!

## 📄 License

[MIT](LICENSE) © 2026
