
import store from '@/store/user.js'
export const perm = function (app) {
    app.directive("perm", {
        mounted(el, query) {
            el.style.display = query.value ? 'none' : ''
        }
    })
}