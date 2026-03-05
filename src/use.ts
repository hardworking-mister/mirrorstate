import { globalSignal, stateStore, middleware } from "./core"
import type { State, Initial } from "./types"

const componentSubscribe = new Map<string, Set<string>>()
const componentOff = new Map<string, Set<Function>>()

/**
 * 清理函数 当组件卸载时调用
 * @param id - 组件id
 * @returns void
 */
export const cleanup = (id: string) => {
  if (componentSubscribe.has(id)) {
    const unsubscribe = componentOff.get(id) as Set<Function>
    unsubscribe.forEach((item) => {
      item()
    })
    componentSubscribe.delete(id)
    componentOff.delete(id)
  } else {
    console.warn(`${id} not found`)
  }
}

/**
 * 创建仓库
 * @param props - 配置项
 * @returns 数据对象
 */
export const useCreateStore = <T extends Record<string, (value?: any) => any>>(props: Initial<T>): State<T> => {
  const { storeName, useManager, middlewares = [], componentId } = props
  if (typeof storeName !== 'string') {
    throw new Error('storeName must be a string')
  }

  const state = useManager()

  // 如果仓库不存在 初始化仓库
  if (!stateStore.isStoreName(storeName)) {
    const current: Record<string, any> = {}
    for (const key in state) {
      const callback = state[key] as (value?: any) => any
      current[key] = callback()
    }
    stateStore.add(storeName, current)
  }

  if (!componentSubscribe.has(componentId)) {
    componentSubscribe.set(componentId, new Set())
    componentOff.set(componentId, new Set())
  }

  const subscribe = componentSubscribe.get(componentId) as Set<string>
  const unsubscribe = componentOff.get(componentId) as Set<Function>

  const proxy = new Proxy(state, {
    get: (target, property) => {
      const key = String(property)
      if (typeof target[key] !== "function") {
        throw Error(`${storeName}.${key} not function, value must is function`)
      }
      const set = (value: T[keyof T]) => {
        const storeValue = stateStore.getValue(storeName, key)
        // 判断是否为获取
        if (value === void 0) {
          middleware.use(middlewares)
          middleware.run({
            key,
            type: "get",
            target,
            storeName,
            store: stateStore.getStore(storeName),
            value
          })
          return (target[key] as Function)()
        }
        // 判断和新值是否相等
        if (storeValue === value) {
          return (target[key] as Function)()
        }
        middleware.use(middlewares)
        middleware.run({
          key,
          type: "set",
          storeName,
          store: stateStore.getStore(storeName),
          target,
          value
        })
        return (target[key] as Function)()
      }
      if (!subscribe.has(`${storeName}-${key}`)) {
        const off = globalSignal.on(`${storeName}-${key}`, target[key] as unknown as Function)
        subscribe.add(`${storeName}-${key}`)
        unsubscribe.add(off)
      }
      return set
    },
  })
  return proxy
}

/**
 * 批量更新 批量更新会返回全部的值 但不会触发订阅
 * @param storeName - 仓库名字
 * @param value - 新值
 * @returns - 全部状态
 */
export const batch = <T extends Record<string, any>>(storeName: string, value?: T) => {
  const state = stateStore.getStore(storeName)
  if (value !== void 0) {
    for (const key in value) {
      stateStore.setValue(storeName, key, value[key])
      globalSignal.emit(`${storeName}-${key}`, value[key])
    }
  }
  return state
}

