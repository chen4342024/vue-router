/* @flow */

/**
 * 依次执行
 * 队列一个一个的执行 fn ，
 * 全部执行完执行 cb
 */
export function runQueue(queue: Array < ? NavigationGuard > , fn : Function, cb: Function) {
    const step = index => {
        if (index >= queue.length) {
            cb()
        } else {
            if (queue[index]) {
                fn(queue[index], () => {
                    step(index + 1)
                })
            } else {
                step(index + 1)
            }
        }
    }
    step(0)
}
