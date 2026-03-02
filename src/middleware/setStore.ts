import { Middleware } from "../types";
import { globalSignal, stateStore } from "../core";

export const setStore: Middleware = async (ctx, next) => {
  const { storeName, key, oldValue, newValue, type } = ctx
  if (type !== "set") {
    return next()
  }
  stateStore.setValue(storeName, key, newValue)
  globalSignal.emit(`${storeName}-${key}`, newValue)
  next()
}