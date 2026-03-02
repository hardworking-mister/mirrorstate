
export type State<T extends Record<string, (value?: any) => any>> = {
    [K in keyof T]: T[K] extends (value?: any) => infer R ? (value: R) => R : never;
}

export type FixedState<T extends Record<string, (value?: any) => any>> = {
    batch: () => { [K in keyof T]: T[K] extends (value?: any) => infer R ? R : never }
}

export type Context = {
    /**
     * - 触发类型: set-更新, get-获取
     */
    type: 'set' | 'get'
    /**
     *  - 仓库名字
     */
    storeName: string
    /**
     * - 当前值的key
     */
    key: string
    /**
     * - 当前值
     */
    value?: any
    /**
     * - set时心值
     */
    newValue?: any
}
export type Next = () => Promise<void>
export type Middleware = (ctx: Context, next: Next) => Promise<void>

export type Initial<T> = {
    storeName: string,
    useManager: () => T,
    componentId: string,
    middlewares: Middleware[]
}