import type { Middleware, Context } from "../types";
import { setStore } from "../middleware";

export class MiddlewareManager {
  // 默认中间件
  #middlewares: Middleware[] = [setStore]

  use(middlewares: Middleware[]) {
    this.#middlewares = [...middlewares, ...this.#middlewares]
  }

  async run(ctx: Context) {
    let index = -1
    const dispatch = async (i: number): Promise<void> => {
      if (i <= index) throw new Error('next() called multiple times')
      index = i
      const middleware = this.#middlewares[i]
      if (!middleware) return
      await middleware(ctx, () => dispatch(i + 1))
    }

    await dispatch(0)

    return ctx
  }
}

export const middleware = new MiddlewareManager()