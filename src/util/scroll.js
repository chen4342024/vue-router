/* @flow */

import type Router from '../index'
import { assert } from './warn'
import { getStateKey, setStateKey } from './push-state'

const positionStore = Object.create(null)

// 设置滚动时间
export function setupScroll() {
    // Fix for #1585 for Firefox
    // Fix for #2195 Add optional third attribute to workaround a bug in safari https://bugs.webkit.org/show_bug.cgi?id=182678
    window.history.replaceState({ key: getStateKey() }, '', window.location.href.replace(window.location.origin, ''))
    window.addEventListener('popstate', e => {
        saveScrollPosition()
        if (e.state && e.state.key) {
            setStateKey(e.state.key)
        }
    })
}

// 处理滚动时间
export function handleScroll(
    router: Router,
    to: Route,
    from: Route,
    isPop: boolean
) {

    if (!router.app) {
        return
    }

    // 获取配置的 scrollBehavior
    const behavior = router.options.scrollBehavior
    if (!behavior) {
        return
    }

    if (process.env.NODE_ENV !== 'production') {
        assert(typeof behavior === 'function', `scrollBehavior must be a function`)
    }

    // wait until re-render finishes before scrolling
    // 等渲染结束后才滚动位置
    router.app.$nextTick(() => {

        // 获取滚动的位置
        const position = getScrollPosition()
        const shouldScroll = behavior.call(router, to, from, isPop ? position : null)

        if (!shouldScroll) {
            return
        }

        if (typeof shouldScroll.then === 'function') {
            // 如果是返回一个promise
            shouldScroll.then(shouldScroll => {
                scrollToPosition((shouldScroll: any), position)
            }).catch(err => {
                if (process.env.NODE_ENV !== 'production') {
                    assert(false, err.toString())
                }
            })
        } else {
            // 滚动到特定位置
            scrollToPosition(shouldScroll, position)
        }
    })
}

// 保存滚动的位置
export function saveScrollPosition() {
    const key = getStateKey()
    if (key) {
        positionStore[key] = {
            x: window.pageXOffset,
            y: window.pageYOffset
        }
    }
}

// 返回滚动的位置
function getScrollPosition(): ? Object {
    const key = getStateKey()
    if (key) {
        return positionStore[key]
    }
}

// 获取元素的位置
function getElementPosition(el: Element, offset: Object) : Object {
    const docEl: any = document.documentElement
    const docRect = docEl.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    return {
        x: elRect.left - docRect.left - offset.x,
        y: elRect.top - docRect.top - offset.y
    }
}

// 是否是有效的数字
function isValidPosition(obj: Object): boolean {
    return isNumber(obj.x) || isNumber(obj.y)
}

// 修正位置
function normalizePosition(obj: Object): Object {
    return {
        x: isNumber(obj.x) ? obj.x : window.pageXOffset,
        y: isNumber(obj.y) ? obj.y : window.pageYOffset
    }
}

// 修正偏移量
function normalizeOffset(obj: Object): Object {
    return {
        x: isNumber(obj.x) ? obj.x : 0,
        y: isNumber(obj.y) ? obj.y : 0
    }
}

// 是否是数字
function isNumber(v: any): boolean {
    return typeof v === 'number'
}

// 滚动的位置
function scrollToPosition(shouldScroll, position) {
    const isObject = typeof shouldScroll === 'object'
    // 选择器
    if (isObject && typeof shouldScroll.selector === 'string') {
        // 获取元素
        const el = document.querySelector(shouldScroll.selector)
        if (el) {
            // 滚动到对应的元素，例如某个锚点
            let offset = shouldScroll.offset && typeof shouldScroll.offset === 'object' ? shouldScroll.offset : {}
            offset = normalizeOffset(offset)
            position = getElementPosition(el, offset)
        } else if (isValidPosition(shouldScroll)) {
            position = normalizePosition(shouldScroll)
        }
    } else if (isObject && isValidPosition(shouldScroll)) {
        // shouldScroll 为位置数据
        position = normalizePosition(shouldScroll)
    }

    if (position) {
        window.scrollTo(position.x, position.y)
    }
}
