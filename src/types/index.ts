
export type State<T extends Record<string, (value?: any) => any>> = {
    [K in keyof T]: T[K] extends (value?: any) => infer R ? (value: R) => R : never;
}

export type FixdeState<T extends Record<string, (value?: any) => any>> = {
    batch: () => { [K in keyof T]: T[K] extends (value?: any) => infer R ? R : never }
}

export type Initial<T> = {
    storeName: string,
    useManager: () => T,
    componentId: string
}
