import type { Middleware } from "../types";
import { globalSignal, stateStore } from "../core";

export const setStore: Middleware = async (ctx, next) => {
  const { storeName, key, newValue, type, store, triggerFn } = ctx
  if (type === "get") {
    if (store[key] !== newValue) {
      triggerFn(store[key])
    }
    return next()
  }
  store[key] = newValue
  globalSignal.emit(`${storeName}-${key}`, newValue)
  next()
}