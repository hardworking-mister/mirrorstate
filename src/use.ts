import { globalSignal, stateStore, middleware, createProxy } from "./core"
import type { State, Initial, FixedState, MapSet } from "./types"



const component = new Map<string, MapSet>()

/**
 * 创建仓库
 * @param props - 配置项
 * @returns 数据对象
 */
export const createStore = <T extends Record<string, (value?: any) => any>>(props: Initial<T>): State<T> & FixedState<T> => {
  const { storeName, setMethod, middlewares = [], componentId } = props
  if (typeof storeName !== 'string') {
    throw new Error('storeName must be a string')
  }

  // 如果仓库不存在 添加仓库
  if (!stateStore.isStoreName(storeName)) {
    let initial: Record<string, any> = {}
    for (let key in setMethod) {
      initial[key] = (setMethod[key] as () => any)()
    }
    stateStore.add(storeName, initial)
    // 初始化仓库：跑一次 get 中间件链，让 persistent 等插件有机会水合 initial
    for (let key in setMethod) {
      middleware.run({
        type: "get", key, storeName,
        store: initial,
        value: initial[key],
        subscribeStore: globalSignal.getAllSubscribe()
      }, middlewares)
    }
  }

  if (!component.has(componentId)) {
    component.set(componentId, {
      boundStores: new Set(),
      subscribedKeys: new Set(),
      off: new Set(),
      methodProxy: new Set()
    })
  }
  const componentObj = component.get(componentId) as MapSet
  const boundStores = componentObj.boundStores
  let methodProxy = componentObj.methodProxy
  if (boundStores.has(storeName)) {

    let stateProxy;
    methodProxy.forEach((item) => {
      if (item.componentId === componentId) {
        stateProxy = item
      }
    })
    const { replace, proxy } = stateProxy as any
    replace({ currentObj: setMethod, middlewares })
    return proxy
  }
  const off = componentObj.off

  const stateProxy = createProxy({
    componentId,
    currentObj: setMethod,
    stateStore,
    middleware,
    middlewares,
    globalSignal,
    boundStores,
    subscribedKeys: componentObj.subscribedKeys,
    off,
    storeName,
    component
  })

  methodProxy.add(stateProxy)
  const { proxy } = stateProxy
  return proxy as State<T> & FixedState<T>
}

/**
 * 生成全局唯一的组件 ID
 * 优先使用 crypto.randomUUID()，环境不支持时回退到时间戳+随机数
 */
export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}
