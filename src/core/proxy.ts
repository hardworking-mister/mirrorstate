import type { proxyConfig } from "../types";

export const createProxy = (config: proxyConfig) => {
  let currentObj = config.currentObj
  let storeName = config.storeName
  let stateStore = config.stateStore
  let middleware = config.middleware
  let globalSignal = config.globalSignal
  let middlewares = config.middlewares
  let subscribe = config.subscribe
  let off = config.off
  let componentId = config.componentId
  let component = config.component

  const proxy = new Proxy({
    batch: (state: any) => {
      for (const key in state) {
        middleware.use(middlewares)
        middleware.run({
          key,
          storeName,
          store: stateStore.getStore(storeName),
          value: state[key],
          subscribeStore: globalSignal.getAllSubscribe()
        })
      }
    },
    cleanup: () => {
      off.forEach((item) => {
        item()
      })
      component.delete(componentId)
    }
  }, {
    get: (target, property) => {
      const key = String(property)
      const subscribeKey = `${storeName}-${key}`
      if (key === "batch") return target[key]
      if (key === "cleanup") return target[key]
      if (typeof currentObj[key] !== "function") {
        throw Error(`${subscribeKey} not function, value must is function`)
      }
      const state = stateStore.getStore(storeName)
      const set = (value: any) => {
        if (typeof value === "function") {
          middleware.use(middlewares)
          middleware.run({
            key,
            storeName,
            store: state,
            value: value(state[key]),
            subscribeStore: globalSignal.getAllSubscribe()
          })
          return
        }

        if (currentObj[key]() !== state[key]) {
          currentObj[key](true)(state[key])
        }
        return currentObj[key]()
      }
      if (!subscribe.has(subscribeKey)) {
        subscribe.add(storeName)
        subscribe.add(subscribeKey)
        const unsubscribe = globalSignal.on(`${storeName}-${key}`, currentObj[key](true))
        off.add(unsubscribe)
      }
      return set
    },
  })


  const replace = (config: proxyConfig) => {
    currentObj = config.currentObj
    middlewares = config.middlewares
  }
  return { proxy, replace, componentId }
}
