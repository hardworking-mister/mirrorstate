type proxyConfig = {
  currentObj: any
  storeName: string
  stateStore: any
  middleware: any
  globalSignal: any
  middlewares: any
  subscribe: any
  off: any
}


export const createProxy = (config: proxyConfig) => {
  let currentObj = config.currentObj
  let storeName = config.storeName
  let stateStore = config.stateStore
  let middleware = config.middleware
  let globalSignal = config.globalSignal
  let middlewares = config.middlewares
  let subscribe = config.subscribe
  let off = config.off

  const proxy = new Proxy({}, {
    get: (target, property) => {
      const key = String(property)
      const subscribeKey = `${storeName}-${key}`
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
            value: value(state[key])
          })
        } else {
          return currentObj[key]()
        }
      }
      if (!subscribe.has(subscribeKey)) {
        const unsubscribe = globalSignal.on(`${storeName}-${key}`, currentObj[key](true))
        off.add(unsubscribe)
      }
      return set
    },
  })


  const replace = (config: proxyConfig) => {
    currentObj = config.currentObj
  }
  return { proxy, replace }
}