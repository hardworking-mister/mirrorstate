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
  }

  if (!component.has(componentId)) {
    component.set(componentId, { subscribe: new Set(), off: new Set(), methodProxy: new Set() })
  }
  const componentObj = component.get(componentId) as MapSet
  const subscribe = componentObj.subscribe
  let methodProxy = componentObj.methodProxy
  if (subscribe.has(storeName)) {
    let stateProxy;
    methodProxy.forEach((item) => {
      if (item.id === componentId) {
        stateProxy = item
      }
    })
    const { replace, proxy } = stateProxy as any
    replace({ currentObj: setMethod })
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
    subscribe,
    off,
    storeName,
    component
  })

  methodProxy.add(stateProxy)
  const { proxy } = stateProxy
  return proxy as State<T> & FixedState<T>
}
