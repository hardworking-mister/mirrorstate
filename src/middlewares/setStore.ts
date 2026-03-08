import type { Middleware } from "../types";
import { globalSignal, stateStore } from "../core";

export const setStore: Middleware = async (ctx, next) => {
  const { storeName, key, store, value } = ctx
  if (store[key] !== value) {
    store[key] = value
    globalSignal.emit(`${storeName}-${key}`, value)
  }
  next()
}
