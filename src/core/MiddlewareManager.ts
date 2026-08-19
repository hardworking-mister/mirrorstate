import type { Middleware, Context } from "../types";
import { setStore } from "../middlewares";

export class MiddlewareManager {

  run(ctx: Context, middlewares: Middleware[]) {
    const middlewaresList = [...middlewares, setStore]
    let index = -1
    const dispatch = (i: number) => {
      if (i <= index) throw new Error('next() called multiple times')
      index = i
      const middleware = middlewaresList[i]
      if (!middleware) return
      middleware(ctx, () => dispatch(i + 1))
    }

    dispatch(0)

    return ctx
  }
}

export const middleware = new MiddlewareManager()
