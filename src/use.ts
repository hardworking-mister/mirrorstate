import { globalSignal, stateStore, middleware, createProxy } from "./core"
import type { State, Initial } from "./types"

type MapSet = {
  subscribe: Set<string>,
  off: Set<Function>,
  methodProxy: any
}

const component = new Map<string, MapSet>()


/**
 * 清理函数 当组件卸载时调用
 * @param id - 组件id
 * @returns void
 */
export const cleanup = (componentId: string) => {
  if (component.has(componentId)) {
    const componentObj = component.get(componentId) as MapSet
    const off = componentObj.off
    off.forEach((item) => {
      item()
    })
    component.delete(componentId)
  } else {
    console.warn(`${componentId} not found`)
  }
}

/**
 * 创建仓库
 * @param props - 配置项
 * @returns 数据对象
 */
export const createStore = <T extends Record<string, (value?: any) => any>>(props: Initial<T>): State<T> => {
  const { storeName, setMethod, middlewares = [], componentId, initial } = props
  if (typeof storeName !== 'string') {
    throw new Error('storeName must be a string')
  }

  // 如果仓库不存在 添加仓库
  if (!stateStore.isStoreName(storeName)) {
    let initial: Record<string, any> = {}
    for (let key in setMethod) {
      initial[key] = setMethod[key]()
    }
    stateStore.add(storeName, initial)
  }

  if (!component.has(componentId)) {
    component.set(componentId, { subscribe: new Set(), off: new Set(), methodProxy: null })
  }
  const componentObj = component.get(componentId) as MapSet
  let methodProxy = componentObj.methodProxy
  if (methodProxy) {
    const { replace } = methodProxy
    replace({ currentObj: setMethod })
    return methodProxy
  }
  const subscribe = componentObj.subscribe
  const off = componentObj.off

  methodProxy = createProxy({
    currentObj: setMethod,
    stateStore,
    middleware,
    middlewares,
    globalSignal,
    subscribe,
    off,
    storeName,
  })
  const { proxy } = methodProxy
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

