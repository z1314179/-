import {
    defineStore
} from 'pinia'
import router from '../router/index.js'
import Cookies from 'js-cookie';
import useTabsStore from './tabs.js'

const TOKEN_KEY = 'contract_token_';

function getInitToken() {
    let token = sessionStorage.getItem(TOKEN_KEY) || '';
    const _t = window.name || '';
    const dbToken = JSON.parse(localStorage.getItem('dbToken') || "{}");
    if (!token && _t) {
        token = dbToken[TOKEN_KEY + _t] || '';
        if (token) sessionStorage.setItem(TOKEN_KEY, token);
    }
    if (!token) {
        token = Cookies.get(TOKEN_KEY) || '';
        if (token) sessionStorage.setItem(TOKEN_KEY, token);
    }
    return token;
}
const useStore = defineStore('userInfo', {
    state() {
        return {
            token: getInitToken(),
            userinfo: {},
            routes: [],
            perms: {},
            routeChangeState: false,
            ofsList: {},
            dbToken: JSON.parse(localStorage.getItem('dbToken') || "{}")
        }
    },
    getters: {
        getRouter(state) {
            let arr = state.routes.map(e => {
                return e.children?.map(item => {
                    return { path: item.title, name: item.name }
                })
            })
            return arr.flat(1).filter(e => e)
        },
    },
    actions: {
        getCToken() {
            let token = sessionStorage.getItem(TOKEN_KEY);
            const _t = window.name || '';
            if (!token && _t) {
                token = this.dbToken[TOKEN_KEY + _t] || '';
                if (token) sessionStorage.setItem(TOKEN_KEY, token);
            } else if (!token) {
                token = Cookies.get(TOKEN_KEY) || '';
                if (token) sessionStorage.setItem(TOKEN_KEY, token);
            }
            this.token = token || '';
            return token || '';
        },
        chnageToken(clientId, id) {
            const _t = id || '';
            if (!_t) return '';
            this.userinfo.clientId = clientId;
            const key = TOKEN_KEY + _t;
            return this.dbToken[key] || '';
        },
        setToken(data, isLogin = false) {
            sessionStorage.setItem(TOKEN_KEY, data);
            const expiresDate = new Date();
            expiresDate.setDate(expiresDate.getDate() + 30);
            if (window.name) {
                const key = TOKEN_KEY + window.name;
                if (!isLogin) {
                    this.dbToken = { ...this.dbToken, [key]: data };
                } else {
                    this.dbToken = { [key]: data };
                }
                localStorage.setItem('dbToken', JSON.stringify(this.dbToken));
            }
            Cookies.set(TOKEN_KEY, data, {
                expires: expiresDate,
                secure: false,
                sameSite: "strict",
            });
            this.token = data || ''
        },
        setUser(userinfo) {
            window.name = userinfo?.id || '';
            this.userinfo = userinfo || {}
        },
        setRoutes(routes) {
            this.routes = routes || []
            if (this.routes.length > 0) {
                this.perms = filterPermission(this.routes)
            }
            function filterPermission(arr, obj = {}) {
                if (!arr || !arr.length) return [];
                arr.forEach((item, index) => {
                    if (item.children && item.children.length) {
                        filterPermission(item.children, obj);
                    }
                    if (item.type === 2) {
                        obj[item.name] = item.title || true;
                    }
                });
                return obj;
            }            
        },
        outLogin() {
            let rq = ['/', '/login'].includes(location.pathname) ? '' : window.btoa(location.href)
            this.clear()
            if (window.navigator.userAgent.includes('DingTalk')) {
                router.replace({
                    path: "/dingLogin",
                    query: {
                        rq
                    }
                });
            } else {
                router.replace({
                    path: "/login",
                    query: {
                        rq
                    }
                });
            }
        },
        toLogin() {
            this.clear()
            router.replace("/login");
        },
        clear() {
            this.token = ''
            this.userinfo = {}
            useTabsStore().clearTabs()
            this.routeChangeState = false
            window.name = ''
            Cookies.remove(TOKEN_KEY)
            sessionStorage.removeItem(TOKEN_KEY)
        },

    },
    persist: {
        enabled: true,
        strategies: [{
            key: process.env.NAME,
            storage: localStorage,
            paths: ['routes']
        },
        {
            key: process.env.NAME,
            storage: sessionStorage,
            paths: ['userinfo', 'perms']
        }
        ],
    },

})

export default useStore