import { MiddlewareManager } from '../../src/core'
import type { Context, Middleware } from '../../src/types'

describe('Middleware 中间件系统测试', () => {
    let middlewareManager: MiddlewareManager

    beforeEach(() => {
        middlewareManager = new MiddlewareManager()
    })

    test('应该能正确执行单个中间件', () => {
        const mockMiddleware: Middleware = (ctx, next) => {
            ctx.store.count = ctx.value
            next()
        }

        const ctx: Context = {
            type: 'set',
            storeName: 'test',
            key: 'count',
            store: { count: 0 } as any,
            value: 42,
            subscribeStore: new Map()
        }

        const result = middlewareManager.run(ctx, [mockMiddleware])
        expect(result.store.count).toBe(42)
    })

    test('多个中间件应该按顺序执行', () => {
        const order: number[] = []

        const middleware1: Middleware = (ctx, next) => {
            order.push(1)
            next()
            order.push(4)
        }

        const middleware2: Middleware = (ctx, next) => {
            order.push(2)
            // 不调用 next()，跳过默认 setStore 中间件
            order.push(3)
        }

        middlewareManager.run({} as Context, [middleware1, middleware2])
        expect(order).toEqual([1, 2, 3, 4]) // 洋葱模型
    })

    test('中间件可以提前终止执行', () => {
        const mockFn1 = jest.fn()
        const mockFn2 = jest.fn()

        const middleware1: Middleware = () => {
            mockFn1()
            // 不调用 next()，终止链
        }

        const middleware2: Middleware = (ctx, next) => {
            mockFn2()
            next()
        }

        middlewareManager.run({} as Context, [middleware1, middleware2])

        expect(mockFn1).toHaveBeenCalled()
        expect(mockFn2).not.toHaveBeenCalled()
    })

    test('中间件可以修改上下文', () => {
        const middleware1: Middleware = (ctx, next) => {
            ctx.key = 'modified'
            next()
        }

        const ctx: Context = {
            type: 'set',
            storeName: 'test',
            key: 'original',
            store: {},
            value: 0,
            subscribeStore: new Map()
        }

        const result = middlewareManager.run(ctx, [middleware1])
        expect(result.key).toBe('modified')
    })

    test('没有中间件时应该正常运行', () => {
        const ctx: Context = {
            type: 'set',
            storeName: 'test',
            key: 'count',
            store: { count: 0 } as any,
            value: 42,
            subscribeStore: new Map()
        }

        const result = middlewareManager.run(ctx, [])
        expect(result).toBe(ctx) // 应该直接返回原上下文
    })

    test('next() 被多次调用应该抛错', () => {
        const badMiddleware: Middleware = (ctx, next) => {
            next()
            next() // 第二次调用应该抛错
        }

        const ctx: Context = {
            type: 'set',
            storeName: 'test',
            key: 'count',
            store: { count: 0 } as any,
            value: 42,
            subscribeStore: new Map()
        }

        expect(() => middlewareManager.run(ctx, [badMiddleware])).toThrow('next() called multiple times')
    })
})
