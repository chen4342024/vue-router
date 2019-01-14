/* @flow */

import { inBrowser } from './dom'
import { saveScrollPosition } from './scroll'

// 判断是否支持 push state
export const supportsPushState = inBrowser && (function() {
    const ua = window.navigator.userAgent

    if (
        (ua.indexOf('Android 2.') !== -1 || ua.indexOf('Android 4.0') !== -1) &&
        ua.indexOf('Mobile Safari') !== -1 &&
        ua.indexOf('Chrome') === -1 &&
        ua.indexOf('Windows Phone') === -1
    ) {
        return false
    }

    return window.history && 'pushState' in window.history
})()

// use User Timing api (if present) for more accurate key precision
const Time = inBrowser && window.performance && window.performance.now ?
    window.performance :
    Date

let _key: string = genKey()

// 生成key
function genKey(): string {
    return Time.now().toFixed(3)
}

// 获取state对应的key
export function getStateKey() {
    return _key
}

export function setStateKey(key: string) {
    _key = key
}


export function pushState(url ? : string, replace ? : boolean) {
    saveScrollPosition()
    // try...catch the pushState call to get around Safari
    // DOM Exception 18 where it limits to 100 pushState calls

    // 这里使用 try catch 来捕获是因为 DOM Exception 18 ， 如果有异常，则使用assign来处理
    const history = window.history
    try {
        if (replace) {
            history.replaceState({ key: _key }, '', url)
        } else {
            _key = genKey()
            history.pushState({ key: _key }, '', url)
        }
    } catch (e) {
        window.location[replace ? 'replace' : 'assign'](url)
    }
}

export function replaceState(url ? : string) {
    pushState(url, true)
}
