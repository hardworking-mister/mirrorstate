# MirrorState

[English](./README.en.md) | [中文](./README.md)

一个轻量级、框架无关的响应式状态管理库，理论支持所有框架，让状态回归框架。

[![npm version](https://img.shields.io/npm/v/mirrorstate.svg)](https://www.npmjs.com/package/mirrorstate)
[![license](https://img.shields.io/npm/l/mirrorstate.svg)](https://github.com/hardworking-mister/mirrorstate/blob/main/LICENSE)

![CI](https://github.com/hardworking-mister/mirrorstate/actions/workflows/publish.yml/badge.svg)

## ✨ 特性

* 🚀 **框架无关** - 同一套 API 同时支持各种框架
* 📦 **轻量小巧** - 核心代码仅 2KB，零依赖
* 🎯 **按需更新** - 只有订阅了状态变化的组件才会重新渲染
* 🔧 **中间件机制** - 采用洋葱模型
* 💪 **TypeScript 支持** - 完整的类型推导
* 🎨 **灵活使用** - 既可用于响应式 UI 状态，也可用于非响应式数据

## 📦 安装

```bash
npm install mirrorstate
# 或
yarn add mirrorstate
# 或
pnpm add mirrorstate
```

## 🚀 快速开始

### React 中使用

```tsx
import { createStore, generateId } from "mirrorstate"
import { useEffect, useState } from "react"

// 创建自定义 Hook
const useCounter = () => {
  // 用 useState 懒初始化保存 generateId() 的返回值，保证多次渲染间 id 稳定
  const [componentId] = useState(generateId())
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

// 在组件中使用
function Counter() {
  const { count, text } = useCounter()

  return (
    <div>
      <p>{count()}</p>
      <button onClick={() => count(v => v + 1)}>+1</button>
      <button onClick={() => count(() => 0)}>重置</button>

      <p>{text()}</p>
      <input value={text()} onChange={(e) => text(e.target.value)} />
    </div>
  )
}
```

### Vue 中使用

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
    // Vue setup 只在组件实例首次挂载时执行一次，可以直接调用 generateId()
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
// 在组件中使用
const { count, text } = useCounter()
</script>

<template>
  <div>
    <p>{{ count() }}</p>
    <button @click="count(v => v + 1)">+1</button>
    <button @click="count(() => 0)">重置</button>

    <p>{{ text() }}</p>
    <input :value="text()" @input="text($event.target.value)" />
  </div>
</template>
```

### 关于 componentId 的生成

`createStore` 需要一个在该组件实例生命周期内**稳定唯一**的 `componentId`，用来在内部 Map 里隔离不同组件的订阅集合。库内提供 `generateId()` 函数：

```typescript
import { generateId } from "mirrorstate"

// 默认走 crypto.randomUUID()，环境不支持时回退到时间戳+随机数
const id = generateId()  // 例："7f2a3c1b-8d4e-4f6a-9b3c-1e2d3f4a5b6c"
```

不同场景下的最佳实践：

| 场景 | 推荐写法 | 说明 |
|---|---|---|
| React CSR | `const [componentId] = useState(() => generateId())` | useState 懒初始化保证多次渲染间 id 稳定 |
| React SSR / Next.js | `import { useId } from "react"; const componentId = useId()` | React 18+ 的 useId 是 SSR 安全的，server/client 生成相同 id |
| Vue 3 CSR | `const componentId = generateId()` | setup 只执行一次，直接调即可 |
| Vue 3 SSR / Nuxt | `const componentId = useId()` (Nuxt 3.5+) | Nuxt 内置的 useId 解决了 SSR 一致性 |
| 全局单例 store | `const componentId = "global-route-store"` | 固定字符串，用于跨组件共享的非响应式状态 |

> 💡 **简单原则**：CSR 应用直接用 `generateId()` + 框架状态原语即可；SSR 应用优先用框架自带的 `useId()`，避免水合不匹配。

## 📖 核心概念

### ⚠️ 关于 React Strict Mode

由于本库采用 "把状态镜像回框架原语" 的设计，React 18+ 的 Strict Mode 下首次渲染会有 stale closure 兜底逻辑被双触发，可能出现一帧闪值。建议在非 Strict Mode 下使用，或在生产环境关闭 Strict Mode。

### createStore 配置

```typescript
interface CreateStoreOptions<T> {
  // 必填：组件唯一标识，用于状态隔离
  componentId: string
  
  // 必填：仓库名称
  storeName: string
  
  // 必填：状态定义
  setMethod: {
    [K in keyof T]: (v?: any) => any
  }
  
  // 可选：中间件数组
  middlewares?: Middleware[]
}
```

### setMethod 的设计哲学

setMethod 采用函数式设计，通过参数判断是读还是写：

```typescript
setMethod: {
  // 当传入 false 时 进行值的获取-初始化
  // 当传入 true 时 进行订阅
  count: (v) => v ? setCount : count,
  
  // 更新时:函数式更新（必须传函数，传普通值会抛错）
  count(v => v + 1) 
  // 读取时:参数为空
  count()
}
```

> ⚠️ **更新只接受函数式更新**。`count(100)` 这种直接传值会抛错——请用 `count(() => 100)` 或 `count(v => 100)`。这能避免静默 no-op 的坑。

### 中间件

中间件让你能够在状态变更前后执行自定义逻辑。**中间件必须同步调用 `next()`**，不支持在 `await` 之后调用——这保证了 `createStore` 初始化阶段的水合能同步完成。

```typescript
import type { Middleware } from "mirrorstate"

// 日志中间件
const logger: Middleware = (ctx, next) => {
  console.log(`[${ctx.storeName}] ${ctx.key}:`, ctx.value)
  next()
  console.log(`[${ctx.storeName}] ${ctx.key} 更新完成`)
}

// 持久化中间件（库内已内置 plugin.persistent，这里仅作示例）
const persist: Middleware = (ctx, next) => {
  next()
  localStorage.setItem(ctx.storeName, JSON.stringify(ctx.store))
}

// 使用中间件
const store = createStore({
  componentId: useId(),
  storeName: "user",
  middlewares: [logger, persist],
  setMethod: {
    name: (v) => v ? setName : name
  }
})
```

## 🎯 高级用法

### 1. 全局路由状态（非响应式）

```typescript
// store/route.ts
import { createStore } from "mirrorstate"

export const useRouteStore = () => {
  // 使用固定 ID，确保全局唯一
  const componentId = "global-route-store"
  
  // 普通变量，不触发视图更新
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

// 在路由守卫中使用
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

### 2. 批量更新

```typescript
const { batch } = useUser()

// 一次更新多个状态
batch({
  name: '张三',
  age: 25,
  email: 'zhangsan@example.com'
})
```

### 3. 组件间通信

```typescript
// Component A
function Sender() {
  const { count } = useCounter()
  
  return <button onClick={() => count(() => 100)}>发送</button>
}

// Component B（自动更新）
function Receiver() {
  const { count } = useCounter()  // 使用同一个 storeName
  
  return <div>{count()}</div>  // 当 A 更新时自动重新渲染
}
```

## 🛠 API 参考

### createStore(options)

创建状态仓库。

### Store 实例方法

| 方法 | 描述 |
|------|------|
| `state()` | 获取状态值 |
| `state(fn)` | 函数式更新 |
| `batch(object)` | 批量更新多个状态 |
| `cleanup()` | 清理订阅和状态 |

### 中间件上下文 (Context)

```typescript
interface Context {
  storeName: string  // 仓库名称
  key: string        // 更新的键名
  store: any         // 整个仓库对象
  value: any         // 新值
  subscribeStore: Map<string, Set<Function>>  // 订阅者信息
}
```

## ⚡ 性能优化

1. **按需订阅**：只有组件实际使用的状态才会建立订阅关系
2. **精准更新**：状态变化只通知真正订阅的组件
3. **自动清理**：组件卸载时自动取消所有订阅
4. **非响应式支持**：对于不需要触发视图更新的数据（如路由状态），使用普通变量存储

## 🤝 贡献指南

欢迎贡献代码或提出建议！

## 📄 许可证

[MIT](LICENSE) © 2026
