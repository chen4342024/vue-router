/* @flow */

import type VueRouter from '../index'
import { stringifyQuery } from './query'

const trailingSlashRE = /\/?$/

// 创建路由对象
export function createRoute(
    record: ? RouteRecord,
    location : Location,
    redirectedFrom ? : ? Location,
    router ? : VueRouter
): Route {
    const stringifyQuery = router && router.options.stringifyQuery


    let query: any = location.query || {}
    try {
        query = clone(query)
    } catch (e) {}

    const route: Route = {
        name: location.name || (record && record.name),
        meta: (record && record.meta) || {},
        path: location.path || '/',
        hash: location.hash || '',
        query,
        params: location.params || {},
        fullPath: getFullPath(location, stringifyQuery),
        matched: record ? formatMatch(record) : []
    }
    if (redirectedFrom) {
        route.redirectedFrom = getFullPath(redirectedFrom, stringifyQuery)
    }
    // 冻结路由对象，防止篡改
    return Object.freeze(route)
}

function clone(value) {
    if (Array.isArray(value)) {
        return value.map(clone)
    } else if (value && typeof value === 'object') {
        const res = {}
        for (const key in value) {
            res[key] = clone(value[key])
        }
        return res
    } else {
        return value
    }
}

// the starting route that represents the initial state
export const START = createRoute(null, {
    path: '/'
})

function formatMatch(record: ? RouteRecord): Array < RouteRecord > {
    const res = []
    while (record) {
        res.unshift(record)
        record = record.parent
    }
    return res
}

// 获取完整路径 path + query + hash
function getFullPath({ path, query = {}, hash = '' },
    _stringifyQuery
): string {
    const stringify = _stringifyQuery || stringifyQuery
    return (path || '/') + stringify(query) + hash
}

// 判断是是否是相同的路由
export function isSameRoute(a: Route, b: ? Route): boolean {
    if (b === START) {
        return a === b
    } else if (!b) {
        return false
    } else if (a.path && b.path) {
        return (
            a.path.replace(trailingSlashRE, '') === b.path.replace(trailingSlashRE, '') &&
            a.hash === b.hash &&
            isObjectEqual(a.query, b.query)
        )
    } else if (a.name && b.name) {
        return (
            a.name === b.name &&
            a.hash === b.hash &&
            isObjectEqual(a.query, b.query) &&
            isObjectEqual(a.params, b.params)
        )
    } else {
        return false
    }
}

// 两个对象是否相等
function isObjectEqual(a = {}, b = {}): boolean {
    // handle null value #1566
    if (!a || !b) return a === b
    const aKeys = Object.keys(a)
    const bKeys = Object.keys(b)
    if (aKeys.length !== bKeys.length) {
        return false
    }
    return aKeys.every(key => {
        const aVal = a[key]
        const bVal = b[key]
        // check nested equality
        if (typeof aVal === 'object' && typeof bVal === 'object') {
            return isObjectEqual(aVal, bVal)
        }
        return String(aVal) === String(bVal)
    })
}

export function isIncludedRoute(current: Route, target: Route): boolean {
    return (
        current.path.replace(trailingSlashRE, '/').indexOf(
            target.path.replace(trailingSlashRE, '/')
        ) === 0 &&
        (!target.hash || current.hash === target.hash) &&
        queryIncludes(current.query, target.query)
    )
}

function queryIncludes(current: Dictionary < string > , target: Dictionary < string > ): boolean {
    for (const key in target) {
        if (!(key in current)) {
            return false
        }
    }
    return true
}
