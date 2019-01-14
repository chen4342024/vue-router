/* @flow */

// 断言
export function assert(condition: any, message: string) {
    if (!condition) {
        throw new Error(`[vue-router] ${message}`)
    }
}

// 警告
export function warn(condition: any, message: string) {
    if (process.env.NODE_ENV !== 'production' && !condition) {
        typeof console !== 'undefined' && console.warn(`[vue-router] ${message}`)
    }
}

// 判断是否是错误
export function isError(err: any): boolean {
    return Object.prototype.toString.call(err).indexOf('Error') > -1
}
