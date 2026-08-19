import { PubSub, MiddlewareManager } from "../core"

/**
 * 从 setMethod 函数返回类型中提取状态值类型（排除 setter 函数变体）
 * 例如 setMethod.count = (v) => v ? setCount : count
 *   - 返回类型是 ((value: number) => void) | number
 *   - StateValue 提取后得到 number
 */
type StateValue<F> = F extends (v?: any) => infer R
  ? R extends (...args: any[]) => any
    ? never
    : R
  : never

/**
 * 状态值映射类型 { count: number, name: string, ... }
 */
type StateValues<T extends Record<string, (value?: any) => any>> = {
    [K in keyof T]: StateValue<T[K]>
}

/**
 * 暴露给使用者的 state 接口
 *   - count() 读取值
 *   - count(updater) 函数式更新
 */
export type State<T extends Record<string, (value?: any) => any>> = {
    [K in keyof T]: {
      (): StateValue<T[K]>
      (updater: (prev: StateValue<T[K]>) => StateValue<T[K]>): StateValue<T[K]>
    }
}

export type FixedState<T extends Record<string, (value?: any) => any>> = {
    batch: (state: StateValues<T>) => void
    cleanup: () => void
}

export type Context = {
    /**
     *  - 触发类型
     */
    type: "get" | "set"
    /**
     *  - 仓库名字
     */
    storeName: string
    /**
     * - 触发的key
     */
    key: string

    /**
     * 仓库信息
     */
    store: Record<string, any>,

    /**
     * - 新值
     */
    value: any,

    /**
     * 订阅者信息
     */
    subscribeStore: any
}
export type Next = () => void
export type Middleware = (ctx: Context, next: Next) => void

export type Initial<T extends Record<string, (value?: any) => any>> = {
    storeName: string,
    setMethod: T
    componentId: string,
    middlewares?: Middleware[]
}

export type MapSet = {
    /** 该组件已绑定的仓库名集合 */
    boundStores: Set<string>,
    /** 已订阅的完整 key 集合（格式：${storeName}-${key}） */
    subscribedKeys: Set<string>,
    off: Set<Function>,
    methodProxy: Set<any>
}

export type proxyConfig = {
    currentObj: any
    storeName: string
    stateStore: Record<string, any>
    middleware: MiddlewareManager
    globalSignal: PubSub
    middlewares: Middleware[]
    boundStores: Set<string>
    subscribedKeys: Set<string>
    off: Set<Function>
    componentId: string
    component: Map<string, MapSet>
}
