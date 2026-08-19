import type { Middleware } from "../types";
import { globalSignal } from "../core";

// 此中间件为最后执行的中间件
export const setStore: Middleware = (ctx, next) => {
  const { storeName, key, store, value } = ctx
  if (store[key] !== value) {
    store[key] = value
    globalSignal.emit(`${storeName}-${key}`, value)
  }
  next()
}
