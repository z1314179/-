import {
    defineStore
} from 'pinia'
import { Modal } from 'ant-design-vue';
const useStore = defineStore('tabs', {
    state() {
        return {
            targetRoute: '',
            routes: [],
            tabs: [{
                path: 'home',
                name: '首页',
            }],
            params: {}
        }
    },
    getters: {
        tabsObj(state) {
            return state.tabs.reduce((acc, tab, index) => {
                acc[tab.path] = { ...tab, index }
                return acc
            }, {})
        },
        getTatgerTab(state) {
            return state.tabsObj[state.targetRoute]
        }
    },
    actions: {
        setTargetRoute(targetRoute) {
            this.targetRoute = targetRoute || ''
            document.title = "合同系统-" + this.tabsObj[targetRoute]?.name || 'lz'
        },
        setTabs(path, route) {
            if ((!this.tabsObj[path])) {
                this.tabs.push({
                    path,
                    name: route.query.mode || route.name,
                    ...route.meta
                })
            }
        },
        syncDelTabs(index) {
            let path = this.tabs[index]
            if (!path) return false
            let that = this
            return new Promise(async (resolve, reject) => {
                if (path.type == 'edit') {
                    Modal.confirm({
                        title: '提示',
                        content: '确认关闭？',
                        onOk() {
                            that.tabs.splice(index, 1)
                            resolve(true)
                        },
                        onCancel() {
                            resolve(false)
                        },
                    });
                } else {
                    that.tabs.splice(index, 1)
                    resolve(true)
                }

            })
        },
        delTabs(index) {
            this.tabs.splice(index, 1)
        },
        setParams(params = {}) {
            if (this.targetRoute) {
                this.params[this.targetRoute] = params
            }
        },
        getParams(params) {
            let path = this.targetRoute
            if (!path) return {}
            let obj = JSON.parse(JSON.stringify(this.params[path] || {}))
            if (params == 'del') {
                delete this.params[path]
            }
            return obj
        },
        clearTabs() {
            this.tabs = []
        },
    },
    persist: {
        enabled: true,
        strategies: [
            {
                key: process.env.NAME + '_tabs',
                storage: sessionStorage,
                paths: ['params']
            }
        ],
    },
})

export default useStore