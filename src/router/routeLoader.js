// src/utils/routeLoader.js
import useStore from '@/store/user.js';
import {
  addRouteFn,
  importPlugin
} from '@/router/index.js'; // 假设 `modules` 在 router 文件中定义
import {
  getRoutes
} from '@/api/menu.js';
// 动态获取和添加路由
export async function fetchAndAddRoutes(router, basicName) {
  const user = useStore();
  try {
    const res = await getRoutes()
    const newRoutes = res.data
    if (JSON.stringify(user.routes) !== JSON.stringify(newRoutes)) {
      user.setRoutes(newRoutes);
      console.log(`
                  ^   ^  
                 ( o o )
                   \\_/  
                `);
      // 移除旧的动态路由
      router.getRoutes().forEach((route) => {
        if (route.meta.port) {
          router.removeRoute(route.name);
        }
      });
      newRoutes.forEach(e => {
        let c_state = e.children && e.children.length && e.children.some(z => z.type === 1)
        if (c_state) {
          e.children.forEach(z => {
            addRouteFn(z)
          })
        } else {
          addRouteFn(e)
        }
      })
    } else {
      user.setRoutes(newRoutes);
    }
    if (!routeHas(basicName)) {
      router.replace({
        path: '/'
      })
    }
    function routeHas(basicName) {
      return router.hasRoute(basicName)
    }
  } catch (error) {
    user.outLogin()
  }
}