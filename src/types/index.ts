import { PubSub, MiddlewareManager } from "../core"

export type State<T extends Record<string, (value: any) => any>> = {
    [K in keyof T]: (value?: () => any) => ReturnType<T[K]>
}

export type FixedState<T extends Record<string, (value: any) => any>> = {
    batch: (state: T) => void
    cleanup: () => void
}

export type Context = {
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

}
export type Next = () => Promise<void>
export type Middleware = (ctx: Context, next: Next) => Promise<void>

export type Initial<T extends Record<string, (value: any) => any>> = {
    storeName: string,
    setMethod: T
    componentId: string,
    middlewares?: Middleware[]
}

export type MapSet = {
    subscribe: Set<string>,
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
    subscribe: Set<string>
    off: Set<Function>
    componentId: string
    component: Map<string, MapSet>
}
