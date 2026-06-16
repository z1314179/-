import { defineStore } from "pinia";
import { getDepartmentList } from "@/api/users.js";
import { getUserInfo } from '@/api/login'
import {
  getHomeStatisticsList,
} from "@/api/Home/index.js";
const useStore = defineStore("appInterface", {
  state() {
    return {
      ofsList: {},
      deptList: [],
      userInfo: {},
      homeStatisticsData: {}
    };
  },
  getters: {},
  actions: {
    async getDepartmentList() {
      const res = await getDepartmentList();
      this.deptList = res.data;
      return res.data;
    },
    async getUserInfos() {
      const res = await getUserInfo();
      this.userInfo = res.data;
      return res.data;
    },
    async getHomeStatistics(params) {
      this.getTimerData(params);
    },
    async getTimerData(params) {
      const res = await getHomeStatisticsList(params);
      return res;
    },
    setHomeStatisticsData(data) {
      this.homeStatisticsData = data;
    },
  },
  persist: {
    enabled: true,
    strategies: [
      {
        key: process.env.NAME,
        storage: sessionStorage,
        paths: [""],
      },
    ],
  },
});

export default useStore;
