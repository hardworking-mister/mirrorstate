import { MiddlewareManager } from '../../src/core'
import type { Context, Middleware } from '../../src/types'

describe('Middleware 中间件系统测试', () => {
    let middlewareManager: MiddlewareManager

    beforeEach(() => {
        middlewareManager = new MiddlewareManager()
    })

    test('应该能正确执行单个中间件', async () => {
        const mockMiddleware: Middleware = async (ctx, next) => {
            ctx.store.count = ctx.value
            await next()
        }

        middlewareManager.use([mockMiddleware])

        const ctx: Context = {
            storeName: 'test',
            key: 'count',
            store: { count: 0 },
            value: 42
        }

        const result = await middlewareManager.run(ctx)
        expect(result.store.count).toBe(42)
    })

    test('多个中间件应该按顺序执行', async () => {
        const order: number[] = []

        const middleware1: Middleware = async (ctx, next) => {
            order.push(1)
            await next()
            order.push(4)
        }

        const middleware2: Middleware = async (ctx, next) => {
            order.push(2)
            // 不调用next方法 跳过默认中间件
            // await next()
            order.push(3)
        }

        middlewareManager.use([middleware1, middleware2])

        await middlewareManager.run({} as Context)
        expect(order).toEqual([1, 2, 3, 4]) // 洋葱模型
    })

    test('中间件可以提前终止执行', async () => {
        const mockFn1 = jest.fn()
        const mockFn2 = jest.fn()

        const middleware1: Middleware = async (ctx, next) => {
            mockFn1()
            // 不调用 next()，终止链
        }

        const middleware2: Middleware = async (ctx, next) => {
            mockFn2()
            await next()
        }

        middlewareManager.use([middleware1, middleware2])
        await middlewareManager.run({} as Context)

        expect(mockFn1).toHaveBeenCalled()
        expect(mockFn2).not.toHaveBeenCalled()
    })

    test('中间件可以修改上下文', async () => {
        const middleware1: Middleware = async (ctx, next) => {
            ctx.key = 'modified'
            await next()
        }

        middlewareManager.use([middleware1])

        const ctx: Context = {
            storeName: 'test',
            key: 'original',
            store: {},
            value: 0
        }

        const result = await middlewareManager.run(ctx)
        expect(result.key).toBe('modified')
    })

    test('没有中间件时应该正常运行', async () => {
        middlewareManager.use([])

        const ctx: Context = {
            storeName: 'test',
            key: 'count',
            store: { count: 0 },
            value: 42
        }

        const result = await middlewareManager.run(ctx)
        expect(result).toBe(ctx) // 应该直接返回原上下文
    })

    // test('中间件中的错误应该能被捕获', () => {
    //     const errorMiddleware: Middleware = () => {
    //         throw new Error('中间件错误')
    //     }

    //     middlewareManager.use([errorMiddleware])

    //     expect(middlewareManager.run({} as Context)).rejects.toThrow('中间件错误')
    // })
})
