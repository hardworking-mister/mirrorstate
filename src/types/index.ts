
export type State<T extends Record<string, (value: any) => any>> = {
    [K in keyof T]: (value?: ReturnType<T[K]>) => ReturnType<T[K]>
}

export type FixedState<T extends Record<string, (value?: any) => any>> = {
    batch: () => { [K in keyof T]: T[K] extends (value?: any) => infer R ? (value?: R) => R : (value?: any) => any }
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
     * - 触发的key
     */
    key: string

    /**
     * - set时新值
     */
    newValue?: any,

    /**
     * 仓库信息
     */
    store: Record<string, any>,

    /**
     * 触发函数
     */
    triggerFn: (value?: any) => any
}
export type Next = () => Promise<void>
export type Middleware = (ctx: Context, next: Next) => Promise<void>

export type Initial<T extends Record<string, (value: any) => any>> = {
    storeName: string,
    useManager: () => T,
    componentId: string,
    middlewares?: Middleware[]
}