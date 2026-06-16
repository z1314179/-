import {
  createRouter,
  createWebHistory,
} from 'vue-router';
import useStore from '@/store/user.js'
import {
  fetchAndAddRoutes
} from "@/router/routeLoader.js"; // 导入提取的方法
import * as dingtalk from 'dingtalk-jsapi'
import {
  pageRoutes
} from './pageRoutes.js'
export const modules = import.meta.glob([
  '../**/*.vue',
  '!../App.vue',
]);
// 动态导入组件

export function importPlugin(name) {

  const plugin = modules[`../${name}.vue`];
  if (plugin) {
    return plugin?.default || plugin;
  }
  return null;
}

const routes = [{
  path: "/",
  name: "首页",
  component: () => import("@/components/Layout/index.vue"),
  children: [
    ...pageRoutes,
    {
      path: '/home',
      name: '系统首页',
      component: () => import("@/views/Home/index.vue"),
      meta: {}
    },
    {
      path: '/upload',
      name: '上传',
      component: () => import("@/components/uploadpage/index.vue"),
    },
    {
      path: '/menu',
      name: '菜单',
      component: () => import("@/components/menuManagement/index.vue"),
    },
    {
      path: '/404',
      name: '404',
      component: () => import("@/components/NotFound/index.vue"),
      meta: {
        notLogin: true,
      }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/home'
    }
  ],
},
{
  path: '/login',
  name: '登陆',
  component: () => import("@/components/login/index.vue"),
  meta: {
    notLogin: true,
  }
},
{
  path: '/dingLogin',
  name: '钉钉登陆',
  component: () => import("@/components/dingLogin/index.vue"),
  meta: {
    notLogin: true,
  }
},
  // {
  //   path: '/:pathMatch(.*)*', // 捕获所有路径
  //   name: 'NotFound',
  //   redirect: '/',
  // },

];

const router = createRouter({
  history: createWebHistory('/'),
  routes
});
export function addRouteFn(item) {
  if (item.type === 2) return;
  let com = item.uri && importPlugin(item.uri)
  if (com) {
    if (router.hasRoute(item.name)) return
    router.addRoute('首页', {
      path: item.title,
      name: item.name,
      component: com,
      children: [],
      meta: {
        port: true
      }
    });
  }

}
let localStorageRoutes = localStorage.getItem(process.env.NAME)
if (localStorageRoutes) {
  localStorageRoutes = JSON.parse(localStorageRoutes)?.routes || []
  localStorageRoutes.forEach(e => {
    let c_state = e.children && e.children.length && e.children.some(z => z.type === 1)
    if (c_state) {
      e.children.forEach(z => {
        addRouteFn(z)
      })
    } else {
      addRouteFn(e)
    }

  })
}
router.beforeEach((to, from, next) => {
  if (window.navigator.userAgent.includes('DingTalk')) {
    dingtalk.ready(function () {
      dingtalk.biz.navigation.setTitle({
        title: '合同系统' 
      });
    });
  } else {
    // document.title = '合同系统' + '-' + to.name || ''
  }
  const user = useStore()
  const token = user.getCToken ? user.getCToken() : user.token
  if (to.meta.notLogin) {
    next()
  } else if (token) {
    next()
    if (!user.routeChangeState) {
      user.routeChangeState = true
      fetchAndAddRoutes(router, to.name);
    }
  } else {
    user.outLogin()
  }
})
export default router;