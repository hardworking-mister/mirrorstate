import { PubSub } from '../../src/core/PubSub'

describe('PubSub 事件系统测试', () => {
    let pubsub: PubSub

    beforeEach(() => {
        pubsub = new PubSub()
    })

    test('应该能正确订阅和发布事件', () => {
        const mockCallback = jest.fn()
        const eventName = 'test-event'

        pubsub.on(eventName, mockCallback)
        pubsub.emit(eventName, 'test data')

        expect(mockCallback).toHaveBeenCalledTimes(1)
        expect(mockCallback).toHaveBeenCalledWith('test data')
    })

    test('发布不存在的事件应该返回 false', () => {
        const result = pubsub.emit('not-exist', 'data')
        expect(result).toBe(false)
    })

    test('应该能正确取消订阅', () => {
        const mockCallback = jest.fn()
        const eventName = 'test-event'

        const off = pubsub.on(eventName, mockCallback)
        off() // 取消订阅

        pubsub.emit(eventName, 'test data')
        expect(mockCallback).not.toHaveBeenCalled()
    })

    test('once 应该只触发一次', () => {
        const mockCallback = jest.fn()
        const eventName = 'test-event'

        pubsub.once(eventName, mockCallback)

        pubsub.emit(eventName, 'first')
        pubsub.emit(eventName, 'second')

        expect(mockCallback).toHaveBeenCalledTimes(1)
        expect(mockCallback).toHaveBeenCalledWith('first')
    })

    test('应该能正确获取所有订阅者', () => {
        const eventName = 'test-event'

        pubsub.on(eventName, () => { })
        pubsub.on(eventName, () => { })

        const listeners = pubsub.listeners(eventName)
        expect(listeners.size).toBe(2)
    })

    test('删除事件应该清理所有订阅', () => {
        const eventName = 'test-event'

        pubsub.on(eventName, () => { })
        pubsub.on(eventName, () => { })

        pubsub.deleteEvent(eventName)

        expect(pubsub.listeners(eventName).size).toBe(0)
        expect(pubsub.emit(eventName)).toBe(false)
    })
})
