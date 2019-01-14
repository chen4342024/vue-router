/* @flow */

import Regexp from 'path-to-regexp'
import { cleanPath } from './util/path'
import { assert, warn } from './util/warn'

export function createRouteMap(
    routes: Array < RouteConfig > ,
    oldPathList ? : Array < string > ,
    oldPathMap ? : Dictionary < RouteRecord > ,
    oldNameMap ? : Dictionary < RouteRecord >
): {
    pathList: Array < string > ;
    pathMap: Dictionary < RouteRecord > ;
    nameMap: Dictionary < RouteRecord > ;
} {
    // the path list is used to control path matching priority
    const pathList: Array < string > = oldPathList || []
    // $flow-disable-line
    const pathMap: Dictionary < RouteRecord > = oldPathMap || Object.create(null)
    // $flow-disable-line
    const nameMap: Dictionary < RouteRecord > = oldNameMap || Object.create(null)

    // 循环遍历 routes ，添加路由记录
    routes.forEach(route => {
        addRouteRecord(pathList, pathMap, nameMap, route)
    })

    // ensure wildcard routes are always at the end
    // 确保 * 匹配符放到最后面
    for (let i = 0, l = pathList.length; i < l; i++) {
        if (pathList[i] === '*') {
            pathList.push(pathList.splice(i, 1)[0])
            l--
            i--
        }
    }

    return {
        pathList,
        pathMap,
        nameMap
    }
}

// 添加路由记录
function addRouteRecord(
    pathList: Array < string > ,
    pathMap: Dictionary < RouteRecord > ,
    nameMap: Dictionary < RouteRecord > ,
    route: RouteConfig,
    parent ? : RouteRecord,
    matchAs ? : string
) {
    const { path, name } = route
    if (process.env.NODE_ENV !== 'production') {
        assert(path != null, `"path" is required in a route configuration.`)
        assert(
            typeof route.component !== 'string',
            `route config "component" for path: ${String(path || name)} cannot be a ` +
            `string id. Use an actual component instead.`
        )
    }

    const pathToRegexpOptions: PathToRegexpOptions = route.pathToRegexpOptions || {}
    const normalizedPath = normalizePath(
        path,
        parent,
        pathToRegexpOptions.strict
    )

    if (typeof route.caseSensitive === 'boolean') {
        pathToRegexpOptions.sensitive = route.caseSensitive
    }

    const record: RouteRecord = {
        path: normalizedPath,
        regex: compileRouteRegex(normalizedPath, pathToRegexpOptions),
        components: route.components || { default: route.component },
        instances: {},
        name,
        parent,
        matchAs,
        redirect: route.redirect,
        beforeEnter: route.beforeEnter,
        meta: route.meta || {},
        props: route.props == null ? {} : route.components ?
            route.props : { default: route.props }
    }

    // 处理子路由
    if (route.children) {
        // Warn if route is named, does not redirect and has a default child route.
        // If users navigate to this route by name, the default child will
        // not be rendered (GH Issue #629)
        if (process.env.NODE_ENV !== 'production') {
            if (route.name && !route.redirect && route.children.some(child => /^\/?$/.test(child.path))) {
                warn(
                    false,
                    `Named Route '${route.name}' has a default child route. ` +
                    `When navigating to this named route (:to="{name: '${route.name}'"), ` +
                    `the default child route will not be rendered. Remove the name from ` +
                    `this route and use the name of the default child route for named ` +
                    `links instead.`
                )
            }
        }
        route.children.forEach(child => {
            const childMatchAs = matchAs ?
                cleanPath(`${matchAs}/${child.path}`) :
                undefined
            addRouteRecord(pathList, pathMap, nameMap, child, record, childMatchAs)
        })
    }

    // 路由别名
    if (route.alias !== undefined) {
        const aliases = Array.isArray(route.alias) ?
            route.alias : [route.alias]

        aliases.forEach(alias => {
            const aliasRoute = {
                path: alias,
                children: route.children
            }
            addRouteRecord(
                pathList,
                pathMap,
                nameMap,
                aliasRoute,
                parent,
                record.path || '/' // matchAs
            )
        })
    }

    if (!pathMap[record.path]) {
        pathList.push(record.path)
        pathMap[record.path] = record
    }

    if (name) {
        if (!nameMap[name]) {
            nameMap[name] = record
        } else if (process.env.NODE_ENV !== 'production' && !matchAs) {
            warn(
                false,
                `Duplicate named routes definition: ` +
                `{ name: "${name}", path: "${record.path}" }`
            )
        }
    }
}

// 编译路径，返回一个正则
function compileRouteRegex(path: string, pathToRegexpOptions: PathToRegexpOptions): RouteRegExp {
    const regex = Regexp(path, [], pathToRegexpOptions)
    if (process.env.NODE_ENV !== 'production') {
        const keys: any = Object.create(null)
        // 检查keys里是否有重复的
        regex.keys.forEach(key => {
            warn(!keys[key.name], `Duplicate param keys in route with path: "${path}"`)
            keys[key.name] = true
        })
    }
    return regex
}

// 修正path
function normalizePath(path: string, parent ? : RouteRecord, strict ? : boolean): string {
    // 替换掉最后一个 /
    if (!strict) path = path.replace(/\/$/, '')
    if (path[0] === '/') return path
    if (parent == null) return path
    // 将 // 替换成 /
    return cleanPath(`${parent.path}/${path}`)
}
