# MirrorState

[English](./README.en.md) | [中文](./README.md)

---
**组件自治的状态管理 · 让框架做框架的事**

bug投递: hardworking-mister@qq.com

## 🎯 设计哲学

**MirrorState** 不是又一个状态管理库，而是一个让**框架原生状态**跨组件共享的桥梁。

* **组件自治** - 状态完全属于组件，但可以在组件间共享
* **零学习成本** - 用你会的框架API，不用学新的响应式系统
* **框架无关** - 理论适配任何具有组件概念的框架
* **类型安全** - 完整的TypeScript支持

## 📦 安装

```bash
npm install mirrorstate
# 或
yarn add mirrorstate
# 或
pnpm add mirrorstate
```

## 🚀 快速开始

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
        // 同一函数，参数决定行为
        count: (value) => value !== undefined ? count.value = value : count.value,
        display: (value) => value !== undefined ? display.value = value : display.value
      }
    }
  })

  return user
}
```

```vue
// 组件A - 显示
<script setup>
import { useUser } from '../store/user'

const { count } = useUser()
</script>

<template>
  <div>{{ count() }}</div>
</template>

// 组件B - 修改
<script setup>
import { useUser } from '../store/user'

const { count } = useUser()

const click = () => {
  count(count() + 1)  // 读取当前值，加1后更新
}
</script>

<template>
  <button @click="click">{{ count() }}</button>
</template>
```

### React

```tsx
// store/user.ts
import { useCreateStore } from "mirrorstate"
import { useId, useState } from "react"
import { useEffect } from "react"

export const useUser = () => {
  const componentId = useId()
  
  // React需要手动清理
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
          return count  // 无参时返回当前值
        }
      }
    }
  })
  
  return user
}
```

```tsx
// 组件A - 显示
import { useUser } from "../store/user"

const Test = () => {
  const { setCount } = useUser()
  return <div>{setCount()}</div>  // 读取
}

// 组件B - 修改
const Hello = () => {
  const { setCount } = useUser()
  const count = setCount()  // 读取当前值
  
  return (
    <button onClick={() => {
      setCount(setCount() + 1)  // 读取当前值，加1后更新
    }}>
      {count}
    </button>
  )
}
```

## 📖 API

### useCreateStore(props)

创建共享状态的核心方法。

```typescript
interface Initial<T> {
  storeName: string      // 仓库唯一标识
  componentId: string    // 组件ID（用于清理）
  middlewares?: Middleware[] // 中间件
  useManager: () => T    // 返回函数对象的工厂函数
}

function useCreateStore<T extends Record<string, Function>>(
  props: Initial<T>
): State<T>
```

### cleanup(componentId)

清理组件相关的订阅。

```typescript
function cleanup(componentId: string): void
```

### batch(storeName, value?)

批量更新状态，不触发中间件。

```typescript
function batch<T>(storeName: string, value?: T): T
```

### 中间件

支持自定义中间件，用于日志、持久化、调试等。

```typescript
export type Context = {
    /**
     * - 触发类型: set-更新, get-获取
     */
    type: 'set' | 'get'
    /**
     *  - 仓库名字
     */
    storeName: string
    /**
     * - 当前值的key
     */
    key: string
    /**
     * - 当前值
     */
    value?: any
    /**
     * - set时心值
     */
    newValue?: any
}

const logger = async (ctx：Context, next) => {
  console.log(`${ctx.type}:`, ctx)
  // 自定义中间件在return前必须主动调用next
  // next以上的代码在更新前执行
  await next()
  // next以下代码在更新后执行
}
```

## 🎨 核心概念

### 函数即API

```typescript
// 一个函数同时处理get/set
const count = (value) => {
  if (value === undefined) {
    return currentValue  // getter
  }
  currentValue = value   // setter
  return value
}

// 使用方式
count()      // 读取
count(10)    // 写入
count(count() + 1)  // 读取并写入
```

### 组件自治

状态定义在组件内，但存储在全局：

```typescript
// 每个组件都能访问到同一个count
组件A: count()  // 0
组件B: count(5) // 写入
组件A: count()  // 5（自动同步）
```

### 跨框架工作流

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  Vue组件    │    │  MirrorState │    │ React组件   │
│  ref响应式  │ ←→ │  Store/PubSub│ ←→ │ useState    │
└─────────────┘    └──────────────┘    └─────────────┘
```

## 🔧 高级用法

### 自定义中间件

```typescript
// 持久化中间件
const persist: Middleware = async (ctx, next) => {
  if (ctx.type === 'set') {
    localStorage.setItem(`${ctx.storeName}-${ctx.key}`, JSON.stringify(ctx.newValue))
  }
  await next()
}

// 使用
useCreateStore({
  storeName: "user",
  middlewares: [persist, logger],
  // ...
})
```

### 批量更新

```typescript
import { batch } from "mirrorstate"

batch('user', {
  count: 10,
  display: false
})
```

## 🤔 为什么不是 Pinia/Zustand/Redux？

| 特性 | MirrorState | Pinia | Zustand | Redux |
|------|-------------|-------|---------|-------|
| **学习曲线** | 0（用框架API） | 中 | 低 | 高 |
| **响应式** | 框架原生 | 自己实现 | 自己实现 | 自己实现 |
| **代码体积** | ~2KB | ~10KB | ~3KB | ~12KB |
| **框架耦合** | 无（适配层） | Vue专用 | React优先 | 框架无关 |
| **组件自治** | ✅ 天生 | ❌ 全局 | ❌ 全局 | ❌ 全局 |

## 📝 注意事项

1. **函数必须返回当前值**（当无参调用时）
2. **storeName必须在全局唯一**

## 🤝 贡献

欢迎PR！特别需要：
* 更多框架的适配器（Svelte, Solid, Angular）
* 测试用例
* 文档完善

## 📄 许可证

MIT © 2026 hardworking-mister

---
