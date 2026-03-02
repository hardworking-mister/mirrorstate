import { globalSignal } from "./PubSub"
import { stateStore } from "./Store"
import type { State, Initial } from "../types"

const compomentMapId = new Map<string, Set<string>>()

/**
 * 清理函数 当组件卸载时调用
 * @param id - 组件id
 * @returns void
 */
export const cleanup = (id: string) => {
  if (!compomentMapId.has(id)) {
    return
  }
  const compomentKey = compomentMapId.get(id) as Set<string | Function>
  compomentKey.forEach((item) => {
    if (typeof item === "function") {
      item()
    }
  })
  compomentMapId.delete(id)
}

/**
 * 创建仓库
 * @param props - 配置项
 * @returns 数据对象
 */
export const useCreateStore = <T extends Record<string, (value?: any) => any>>(props: Initial<T>): State<T> => {
  const { storeName, useManager, componentId } = props
  if (typeof storeName !== 'string') {
    throw new Error('storeName must be a string')
  }

  const state = useManager()

  if (!stateStore.isStoreName(storeName)) {
    const current: Record<string, any> = {}
    for (const key in state) {
      const callback = state[key] as (value?: any) => any
      current[key] = callback()
    }
    stateStore.add(storeName, current)
  }

  if (!compomentMapId.has(componentId)) {
    compomentMapId.set(componentId, new Set())
  }

  const compomentKey = compomentMapId.get(componentId) as Set<string | Function>

  const proxy = new Proxy(state, {
    get: (target: T, property) => {
      const key = String(property)

      const set = (value: T[keyof T]) => {
        if (value !== void 0) {
          stateStore.setValue(storeName, key, value)
          globalSignal.emit(`${storeName}-${key}`, value)
        }
        return target[key]()
      }

      if (!compomentKey.has(`${storeName}-${key}`)) {
        target[key](stateStore.getValue(storeName, key))
        const off = globalSignal.on(`${storeName}-${key}`, target[key])
        compomentKey.add(`${storeName}-${key}`)
        compomentKey.add(off)
      }
      return set
    },
  })

  return proxy as unknown as State<T>
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
