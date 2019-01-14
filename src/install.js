import View from './components/view'
import Link from './components/link'

export let _Vue


// 插件安装方法
export function install(Vue) {
    // 防止重复安装
    if (install.installed && _Vue === Vue) return
    install.installed = true

    _Vue = Vue

    const isDef = v => v !== undefined

    // 注册实例
    const registerInstance = (vm, callVal) => {
        let i = vm.$options._parentVnode
        if (isDef(i) && isDef(i = i.data) && isDef(i = i.registerRouteInstance)) {
            i(vm, callVal)
        }
    }

    // 混入生命周期的一些处理
    Vue.mixin({
        beforeCreate() {
            if (isDef(this.$options.router)) {
                // 如果 router 已经定义了，则调用
                this._routerRoot = this
                this._router = this.$options.router
                this._router.init(this)
                Vue.util.defineReactive(this, '_route', this._router.history.current)
            } else {
                this._routerRoot = (this.$parent && this.$parent._routerRoot) || this
            }
            // 注册实例
            registerInstance(this, this)
        },
        destroyed() {
            registerInstance(this)
        }
    })

    // 挂载变量到原型上
    Object.defineProperty(Vue.prototype, '$router', {
        get() { return this._routerRoot._router }
    })

    // 挂载变量到原型上
    Object.defineProperty(Vue.prototype, '$route', {
        get() { return this._routerRoot._route }
    })

    // 注册全局组件
    Vue.component('RouterView', View)
    Vue.component('RouterLink', Link)

    const strats = Vue.config.optionMergeStrategies
    // use the same hook merging strategy for route hooks
    strats.beforeRouteEnter = strats.beforeRouteLeave = strats.beforeRouteUpdate = strats.created
}
