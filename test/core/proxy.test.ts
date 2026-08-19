import { createProxy } from '../../src/core'
import { stateStore } from '../../src/core'
import { globalSignal } from '../../src/core'
import { middleware } from '../../src/core'
import type { proxyConfig } from '../../src/types'

describe('Proxy 代理功能测试', () => {
    let config: proxyConfig
    let mockBoundStores: Set<string>
    let mockSubscribedKeys: Set<string>
    let mockOff: Set<Function>
    let mockProxy: Set<any>

    beforeEach(() => {
        // 准备测试数据
        const storeName = 'testStore'
        let count = 0
        let name = "test"

        const setCount = (value: number) => {
            count = value
        }

        const setName = (value: string) => {
            name = value
        }
        stateStore.add(storeName, { count, name, })

        mockBoundStores = new Set()
        mockSubscribedKeys = new Set()
        mockOff = new Set()
        mockProxy = new Set()

        let component = new Map()
        component.set("1", {
            boundStores: mockBoundStores,
            subscribedKeys: mockSubscribedKeys,
            off: mockOff,
            methodProxy: mockProxy
        })

        config = {
            currentObj: {
                count: (v?: any) => v ? setCount : count,
                name: (v?: any) => v ? setName : name
            },
            storeName,
            stateStore,
            middleware,
            globalSignal,
            middlewares: [],
            boundStores: mockBoundStores,
            subscribedKeys: mockSubscribedKeys,
            off: mockOff,
            componentId: "1",
            component,
        }
    })

    test('应该能正确创建 proxy', () => {
        const { proxy } = createProxy(config)

        expect(proxy).toBeDefined()
        expect(proxy.batch).toBeDefined()
    })

    test('访问存在的属性应该返回 setter 函数', () => {
        const { proxy } = createProxy(config)

        const countSetter = proxy.count
        expect(typeof countSetter).toBe('function')
    })

    test('访问不存在的属性应该抛出错误', () => {
        const { proxy } = createProxy(config)

        expect(() => {
            ; (proxy as any).notExist
        }).toThrow()
    })

    test('第一次访问属性应该自动订阅', () => {
        const { proxy } = createProxy(config)

        // 访问触发订阅
        proxy.count()

        expect(mockSubscribedKeys.has('testStore-count')).toBe(true)
        expect(mockBoundStores.has('testStore')).toBe(true)
        expect(mockOff.size).toBe(1)
    })

    test('重复访问同一属性不应该重复订阅', () => {
        const { proxy } = createProxy(config)
        proxy.count()
        proxy.count()

        expect(mockSubscribedKeys.size).toBe(1)
        expect(mockBoundStores.size).toBe(1)
        expect(mockOff.size).toBe(1)
    })

    test('是否可以正确触发更新', () => {
        const { proxy } = createProxy(config)
        proxy.count(v => v = 999)

        expect(proxy.count()).toBe(999)
    })

    test('batch 方法应该能批量更新', () => {
        const { proxy } = createProxy(config)
        const mockRun = jest.spyOn(middleware, 'run')

        proxy.batch({
            count: 100,
            name: 'updated'
        })

        expect(mockRun).toHaveBeenCalledTimes(2)
    })

    test('replace 方法应该能更新配置', () => {
        const { proxy, replace } = createProxy(config)

        let count = 999

        const newConfig = {
            ...config,
            currentObj: {
                count: (v?: any) => v ? () => { } : count
            }
        }

        replace(newConfig)

        expect(proxy.count()).toBe(999)
    })

    test('传入非函数非 undefined 值应该抛错（防止 count(100) 静默 no-op）', () => {
        const { proxy } = createProxy(config)

        // 数字
        expect(() => (proxy as any).count(100)).toThrow(/function updater/)
        // 字符串
        expect(() => (proxy as any).count('hello')).toThrow(/function updater/)
        // 对象
        expect(() => (proxy as any).count({ a: 1 })).toThrow(/function updater/)
    })

    test('传入函数式更新不应该抛错', () => {
        const { proxy } = createProxy(config)

        expect(() => proxy.count(() => 100)).not.toThrow()
        expect(proxy.count()).toBe(100)
    })

    test('无参数读取不应该抛错', () => {
        const { proxy } = createProxy(config)

        expect(() => proxy.count()).not.toThrow()
    })
})
