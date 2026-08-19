import type { proxyConfig } from "../types";

export const createProxy = (config: proxyConfig) => {
  let currentObj = config.currentObj
  let storeName = config.storeName
  let stateStore = config.stateStore
  let middleware = config.middleware
  let globalSignal = config.globalSignal
  let middlewares = config.middlewares
  let boundStores = config.boundStores
  let subscribedKeys = config.subscribedKeys
  let off = config.off
  let componentId = config.componentId
  let component = config.component

  const proxy = new Proxy({
    batch: (state: any) => {
      for (const key in state) {
        middleware.run({
          type: "set",
          key,
          storeName,
          store: stateStore.getStore(storeName),
          value: state[key],
          subscribeStore: globalSignal.getAllSubscribe()
        }, middlewares)
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
        throw new Error(`[mirrorstate] ${subscribeKey}: value must be a function, got ${typeof currentObj[key]}`)
      }
      const state = stateStore.getStore(storeName)
      const set = (value: any) => {
        // 静默 footgun 防御：只接受函数式更新或不传参，禁止 count(100) 这类直传值
        if (value !== undefined && typeof value !== "function") {
          throw new Error(
            `[mirrorstate] ${storeName}.${key}() expects a function updater or no argument, got ${typeof value}. ` +
            `Use ${key}(v => v + 1) to update, or ${key}() to read.`
          )
        }

        if (typeof value === "function") {
          middleware.run({
            type: "set",
            key,
            storeName,
            store: state,
            value: value(state[key]),
            subscribeStore: globalSignal.getAllSubscribe()
          }, middlewares)
          return currentObj[key]()
        }

        if (currentObj[key]() !== state[key]) {
          middleware.run({
            type: "get",
            key,
            storeName,
            store: state,
            value: state[key],
            subscribeStore: globalSignal.getAllSubscribe()
          }, middlewares)
          currentObj[key](true)(state[key])
        }
        return currentObj[key]()
      }
      if (!subscribedKeys.has(subscribeKey)) {
        boundStores.add(storeName)
        subscribedKeys.add(subscribeKey)
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
