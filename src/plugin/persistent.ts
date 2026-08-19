import type { Middleware } from "../types";

/**
 * 检查 localStorage 是否可用（SSR / 非浏览器环境返回 false）
 */
const isLocalStorageAvailable = (): boolean => {
    try {
        return typeof localStorage !== 'undefined' && localStorage !== null
    } catch {
        // 某些浏览器在禁用 cookie / 隐私模式下访问 localStorage 会抛错
        return false
    }
}

/**
 * - 持久化插件
 *   - set 时把整个 store 写回 localStorage
 *   - get 时从 localStorage 水合到 ctx.value，让 setStore 写回 store 并广播
 *   - SSR / 无 localStorage 环境下静默跳过，不抛错
 * @param ctx - 携带上下文
 * @param next - 下一个中间件
 */
export const persistent: Middleware = (ctx, next) => {
    if (!isLocalStorageAvailable()) {
        next()
        return
    }
    const { type, storeName, store, key } = ctx
    switch (type) {
        case "set": {
            // 先执行更新
            next()
            // 更新完成保存本地
            try {
                localStorage.setItem(storeName, JSON.stringify(store))
            } catch (e) {
                // 配额超限 / 序列化失败时静默降级
                console.warn(`[mirrorstate/persistent] failed to persist store "${storeName}":`, e)
            }
            break;
        }
        case "get": {
            // 获取本地的值
            let localValue: string | null = null
            try {
                localValue = localStorage.getItem(storeName)
            } catch (e) {
                console.warn(`[mirrorstate/persistent] failed to read store "${storeName}":`, e)
            }
            // 更新仓库
            if (localValue) {
                const parsed = JSON.parse(localValue)
                if (parsed && key in parsed) {
                    ctx.value = parsed[key]
                }
            }
            next()
            break;
        }
    }
}
