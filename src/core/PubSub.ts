export class PubSub {
    #events = new Map<string, Set<Function>>()
    /**
     * 判断事件是否存在
     * @param keyName - 事件名
     * @returns - true-事件存在，false-事件不存在
     */
    isEventName(keyName: string): boolean {
        return this.#events.has(keyName)
    }
    /**
     * 获取某个事件所有订阅者
     * @param keyName - 事件名
     * @returns - 事件集合
     */
    listeners(keyName: string): Set<Function> {
        const isElementKey = this.isEventName(keyName)
        if (!isElementKey) {
            return new Set()
        }
        return this.#events.get(keyName) as Set<Function>
    }
    /**
     * 订阅事件
     * @param keyName - 事件名
     * @param callback - 事件
     * @returns - 取消订阅函数
     */
    on(keyName: string, callback: Function): Function {
        const map = this.#events
        const isEventName = this.isEventName(keyName)
        if (!isEventName) {
            map.set(keyName, new Set())
        }
        const set = this.#events.get(keyName) as Set<Function>
        set.add(callback)
        return () => this.off(keyName, callback)
    }

    /**
     * 一次性订阅
     * @param keyName - 事件名
     * @param callback - 事件
     */
    once(keyName: string, callback: Function) {
        const onceWrapper = (...args: any[]) => {
            callback(...args)
            this.off(keyName, onceWrapper)
        }
        this.on(keyName, onceWrapper)
    }

    /**
     * 取消订阅
     * @param keyName - 事件名
     * @param callback - 事件函数
     * @returns - true-删除成功 null-找不到事件
     */
    off(keyName: string, callback: Function): boolean | null {
        const isElementKey = this.isEventName(keyName)
        if (!isElementKey) {
            return null
        }
        const set = this.#events.get(keyName) as Set<Function>
        set.delete(callback)
        if (set.size === 0) {
            this.#events.delete(keyName)
        }
        return true
    }
    /**
     * 发布事件
     * @param keyName - 事件名
     * @param args - 事件参数
     * @returns - true-发布成功 false-发布失败
     */
    emit(keyName: string, ...args: any[]) {
        const isElementKey = this.isEventName(keyName)
        if (!isElementKey) {
            return false
        }
        const set = this.#events.get(keyName) as Set<Function>
        set.forEach((item) => {
            item(...args)
        })
        return true
    }

    /**
     * 删除某个事件
     * @param keyName - 事件名
     */
    deleteEvent(keyName: string) {
        this.#events.delete(keyName)
    }

    getAllSubscribe() {
        return this.#events
    }
}

export const globalSignal = new PubSub()
