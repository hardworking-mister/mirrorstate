import type { Middleware, Context } from "../types";

export class MiddlewareManager {
  #middlewares: Middleware[] = []

  constructor(middlewares: Middleware[]) {
    this.#middlewares = middlewares
  }
  use(fn: Middleware) {
    this.#middlewares.push(fn)
  }

  async run(ctx: Context) {
    const middlewares = [...this.#middlewares]
    let i = -1
    const dispatch = async (index: number): Promise<void> => {
      if (i <= index) throw new Error('next() called multiple times')
      i = index
      const middleware = middlewares[i]

      if (!middleware) return

      await middleware(ctx, () => dispatch(i + 1))
    }

    await dispatch(0)

    return ctx
  }
}
