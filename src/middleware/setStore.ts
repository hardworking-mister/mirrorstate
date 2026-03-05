import type { Middleware } from "../types";
import { globalSignal, stateStore } from "../core";

export const setStore: Middleware = async (ctx, next) => {
  const { storeName, key, target, type, store, value } = ctx
  if (type === "get") {
    if (store[key] !== target[key]()) {
      target[key](store[key])
    }
    next()
    return
  }

  store[key] = value
  globalSignal.emit(`${storeName}-${key}`, value)
  next()
}