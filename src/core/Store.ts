class Store<T extends Record<string, any>> {
    #store = new Map<string, T>()

    /**
     * 判断仓库是否存在
     * @param storeName - 仓库名
     * @returns - true-存在, false-不存在
     */
    isStoreName(storeName: string) {
        return this.#store.has(storeName)
    }

    /**
     * 添加仓库
     * @param storeName - 仓库名字
     * @param state - 状态
     */
    add(storeName: string, state: T) {
        if (!this.isStoreName(storeName)) {
            this.#store.set(storeName, state)
        }
    }
    /**
     * 删除仓库（对外暴露的清理 API）
     * @param storeName - 仓库名字
     */
    delete(storeName: string) {
        this.#store.delete(storeName)
    }
    /**
     * 设置仓库的值 更新值时调用
     * @param storeName - 仓库名字
     * @param key - 状态key
     * @param value - 新值
     */
    setValue<K extends keyof T>(storeName: string, key: K, value: T[K]) {
        const state = this.#store.get(storeName)
        if (!state) {
            throw new Error(`[mirrorstate] store "${storeName}" does not exist`)
        }
        if (!Object.hasOwn(state, key)) {
            throw new Error(`[mirrorstate] attribute "${String(key)}" does not exist on store "${storeName}"`)
        }
        state[key] = value
    }
    /**
     * 获取状态函数
     * @param storeName - 仓库名
     * @param key - 获取的key
     * @returns - 正常返回key的值
     */
    getValue(storeName: string, key: string) {
        const state = this.#store.get(storeName)
        if (!state) {
            throw new Error(`[mirrorstate] store "${storeName}" does not exist`)
        }
        if (!Object.hasOwn(state, key)) {
            throw new Error(`[mirrorstate] attribute "${key}" does not exist on store "${storeName}"`)
        }
        return state[key]
    }

    /**
     * 获取整个仓库
     * @param storeName - 仓库名字
     * @returns - 仓库
     */
    getStore(storeName: string) {
        return this.#store.get(storeName) as T
    }

    /**
     * 更新整个仓库
     * @param storeName - 仓库名字
     * @param state - 新值
     */
    setStore(storeName: string, state: any) {
        const store = this.getStore(storeName)
        Object.assign(store, state)
    }

    /**
     * 清理所有仓库
     */
    clear() {
        this.#store.clear()
    }
}


export const stateStore = new Store()
