import { stateStore } from '../../src/core/Store'

describe('Store 核心功能测试', () => {
    beforeEach(() => {
        // 每个测试前清理
        stateStore.clear()
    })

    test('应该能正确添加仓库', () => {
        const storeName = 'testStore'
        const initialState = { count: 0, name: 'test' }

        stateStore.add(storeName, initialState)

        expect(stateStore.isStoreName(storeName)).toBe(true)
        expect(stateStore.getStore(storeName)).toEqual(initialState)
    })

    test('重复添加同一仓库不应覆盖', () => {
        const storeName = 'testStore'
        stateStore.add(storeName, { count: 0 })
        stateStore.add(storeName, { count: 100 }) // 尝试覆盖

        expect(stateStore.getStore(storeName)).toEqual({ count: 0 })
    })

    test('应该能正确设置和获取值', () => {
        const storeName = 'testStore'
        const key = 'count'
        stateStore.add(storeName, { count: 0 })
        stateStore.setValue(storeName, key, 42)

        expect(stateStore.getValue(storeName, key)).toBe(42)
    })

    test('设置不存在的属性应该抛出错误', () => {
        const storeName = 'testStore'
        stateStore.add(storeName, { count: 0 })

        expect(() => {
            stateStore.setValue(storeName, 'notExist', 100)
        }).toThrow()
    })

    test('获取不存在的属性应该抛出错误', () => {
        const storeName = 'testStore'
        stateStore.add(storeName, { count: 0 })

        expect(() => {
            stateStore.getValue(storeName, 'notExist')
        }).toThrow()
    })

    test('获取值时仓库不存在应该抛出错误', () => {
        const storeName = 'testStore'

        expect(() => {
            stateStore.getValue(storeName, 'notExist')
        }).toThrow()
    })
})
