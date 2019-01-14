/* @flow */

import type Router from '../index'
import { History } from './base'
import { cleanPath } from '../util/path'
import { getLocation } from './html5'
import { setupScroll, handleScroll } from '../util/scroll'
import { pushState, replaceState, supportsPushState } from '../util/push-state'


/**
 * hash 模式下
 */
export class HashHistory extends History {
    constructor(router: Router, base: ? string, fallback : boolean) {
        super(router, base)
        // check history fallback deeplinking
        if (fallback && checkFallback(this.base)) {
            return
        }
        // 确保 / 开头
        ensureSlash()
    }

    // this is delayed until the app mounts
    // to avoid the hashchange listener being fired too early
    // 初始化的回调
    setupListeners() {
        const router = this.router
        const expectScroll = router.options.scrollBehavior

        // 支持 pushState 并且配置了scrollBehavior
        const supportsScroll = supportsPushState && expectScroll

        if (supportsScroll) {
            setupScroll()
        }

        window.addEventListener(supportsPushState ? 'popstate' : 'hashchange', () => {
            const current = this.current
            if (!ensureSlash()) {
                return
            }
            // 跳转到对应的hash
            this.transitionTo(getHash(), route => {
                if (supportsScroll) {
                    handleScroll(this.router, route, current, true)
                }
                if (!supportsPushState) {
                    replaceHash(route.fullPath)
                }
            })
        })
    }

    // 跳转到
    push(location: RawLocation, onComplete ? : Function, onAbort ? : Function) {
        const { current: fromRoute } = this
        this.transitionTo(location, route => {
            pushHash(route.fullPath)
            handleScroll(this.router, route, fromRoute, false)
            onComplete && onComplete(route)
        }, onAbort)
    }

    // 替换导航
    replace(location: RawLocation, onComplete ? : Function, onAbort ? : Function) {
        const { current: fromRoute } = this
        this.transitionTo(location, route => {
            replaceHash(route.fullPath)
            handleScroll(this.router, route, fromRoute, false)
            onComplete && onComplete(route)
        }, onAbort)
    }

    go(n: number) {
        window.history.go(n)
    }

    // 确保 链接 有变化
    ensureURL(push ? : boolean) {
        const current = this.current.fullPath
        if (getHash() !== current) {
            push ? pushHash(current) : replaceHash(current)
        }
    }

    // 获取当前的路径
    getCurrentLocation() {
        return getHash()
    }
}

function checkFallback(base) {
    const location = getLocation(base)
    if (!/^\/#/.test(location)) {
        window.location.replace(
            cleanPath(base + '/#' + location)
        )
        return true
    }
}

/**
 * 确保 为 / 开头
 */
function ensureSlash(): boolean {
    const path = getHash()
    if (path.charAt(0) === '/') {
        return true
    }
    replaceHash('/' + path)
    return false
}

// 获取 hash 值 , 截取 # 号后面的
export function getHash(): string {
    // We can't use window.location.hash here because it's not
    // consistent across browsers - Firefox will pre-decode it!
    const href = window.location.href
    const index = href.indexOf('#')
    return index === -1 ? '' : decodeURI(href.slice(index + 1))
}

// 获取路径
function getUrl(path) {
    const href = window.location.href
    const i = href.indexOf('#')
    const base = i >= 0 ? href.slice(0, i) : href
    return `${base}#${path}`
}

function pushHash(path) {
    if (supportsPushState) {
        pushState(getUrl(path))
    } else {
        window.location.hash = path
    }
}

function replaceHash(path) {
    if (supportsPushState) {
        replaceState(getUrl(path))
    } else {
        window.location.replace(getUrl(path))
    }
}
