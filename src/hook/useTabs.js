import { ref, reactive, toRaw, computed, onActivated } from "vue";

import tabsStore from "@/store/tabs.js";
import userStore from "@/store/user.js";
import interfaceStore from "@/store/interface.js";
import { useRouter, useRoute } from "vue-router";

export default function useTabs(options = {}) {
  const { dept = false, userType = false } = options;
  const tabs = tabsStore();
  const user = userStore();
  const router = useRouter();
  const route = useRoute();
  const interfaceStores = interfaceStore();
  const deptList = computed(() => {
    return interfaceStores.deptList;
  });
  const userInfos = computed(() => {
    return interfaceStores.userInfo;
  });
  function getDeptListMap(arr) {
    return arr.reduce((acc, item) => {
      acc[item.id] = item;
      if (item.children) {
        acc = { ...acc, ...getDeptListMap(item.children) };
      }
      return acc;
    }, {});
  }
  const deptListMap = computed(() => {
    return getDeptListMap(deptList.value);
  });
  const getDepartmentList = async () => {
    await interfaceStores.getDepartmentList();
    return deptList.value;
  };
  const getUserInfo = async () => {
    await interfaceStores.getUserInfos();
    return userInfos.value;
  };

  /** 流程进行中时，查找当前用户（dingAccount）对应的 RUNNING 任务 */
  function findCurrentUserRunningTask(processInstances) {
    if (!processInstances || processInstances.status !== "RUNNING") return null;
    const runningTasks = processInstances?.tasks?.filter((e) => e.status === "RUNNING");
    const dingAccount = userInfos.value?.dingAccount;
    if (!runningTasks?.length || !dingAccount) return null;
    return runningTasks.find((e) => e.userId === dingAccount) || null;
  }

  onActivated(() => {
    if (dept) {
      getDepartmentList()
    }
    if (userType) {
      getUserInfo();
    }
  });
  //删除当前标签
  const toBack = (path) => {
    tabs.delTabs(tabs.tabsObj[tabs.targetRoute].index);
    if (path === -1) {
      router.go(path);
      return;
    }
    if (route.meta.parentPath) {
      router
        .replace({
          path: route.meta.parentPath,
        })
        .then((res) => { });
    }
  };
  const toReplace = (path, query = {}) => {
    tabs.delTabs(tabs.tabsObj[tabs.targetRoute].index);
    router.replace({
      path: path,
      query: query,
    })
  }
  const { setParams, getParams, params } = tabs;
  // const userInfo = computed(() => {
  //   return user.userinfo;
  // });
  return {
    router,
    route,
    tabs,
    toReplace,
    toBack,
    deptList,
    userInfos,
    findCurrentUserRunningTask,
    deptListMap,
    setParams,
    getParams,
    params,
    // userInfo
  };
}
