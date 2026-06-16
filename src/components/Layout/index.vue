<template>
  <div class="contract-layout">
    <header class="contract-header">
      <div class="flex align-center">
        <img class="contract-header__logo" src="@/assets/logo_c.png" alt="" />
        <span class="contract-header__title">合同管理系统</span>
      </div>
      <div class="flex-1" style="height: 100%">
        <LayoutHeaderMenu />
      </div>
      <div class="contract-header__actions flex">
        <div class="flex mg-r-medium header-actions__item">
          <div
            class="mg-r-medium iconfont icon-tongzhi"
            @click="handlePath('home/NoticeCenter')"
          >
            <i
              class="selected-dot"
              v-if="homeStatisticsData.noticeList?.length > 0"
            ></i>
          </div>
          <div
            class="iconfont icon-yujing"
            @click="handlePath('home/WarningCenter')"
          >
            <i
              class="selected-dot"
              v-if="homeStatisticsData.warningList?.length > 0"
            ></i>
          </div>
        </div>
        <div class="flex align-center" style="height: 100%">
          <a-dropdown
            v-model:open="userDropdownOpen"
            placement="bottom"
            :align="{ offset: [0, 0] }"
          >
            <span class="contract-header__user" role="button" tabindex="0">
              <span class="contract-header__name">{{
                userData.username || "用户"
              }}</span>
              <DownOutlined
                class="layout-menu__down-icon"
                :class="{ 'is-open': userDropdownOpen }"
              />
            </span>
            <template #overlay>
              <a-menu @click="onClick">
                <a-menu-item :key="1">
                  <a href="javascript:;">退出登录</a>
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </div>
    </header>
    <div class="contract-layout__main">
      <div class="contract-layout__body">
        <div class="tab-list">
          <div
            v-for="(item, index) in tabs.tabs"
            :key="index"
            :class="{ active: targetPath === item.path }"
            class="tab-item"
            @click="handlePath(item.path)"
          >
            <span class="flex align-center">
              <i
                class="iconfont icon-shouye"
                style="margin-right: 2px"
                v-if="item.path === 'home'"
              ></i>
              {{ item.name }}</span
            >
            <i
              v-if="tabs.tabs.length > 1 && index !== 0"
              class="iconfont icon-guanbi1 tab-item__close"
              @click.stop="handleDel(index, targetPath === item.path)"
            />
          </div>
        </div>
        <div class="contract-layout__view">
          <router-view v-slot="{ Component }">
            <keep-alive ref="keepalive" :max="20" :include="includeList">
              <component
                v-if="Component"
                :is="handleComponent(Component)"
                :key="pageKey"
              />
            </keep-alive>
          </router-view>
        </div>
      </div>
    </div>
  </div>
  <update-password v-model:visible="updatePasswordState" />
  <reset-password
    v-model:open="resetPasswordState"
    :userData="userData"
    @refresh="handleRefresh"
  />
</template>

<script setup>
import { DownOutlined } from "@ant-design/icons-vue";
import updatePassword from "./updatePassword.vue";
import resetPassword from "@/components/login/resetPassword.vue";
import useStore from "@/store/tabs.js";
import { useRouter, useRoute } from "vue-router";
import LayoutHeaderMenu from "./menu.vue";
import usePerm from "@/hook/usePerm";
import { useLayout } from "./useLayout";
import { ref, computed, watch, h } from "vue";

const { userData, onClick, updatePasswordState, homeStatisticsData } =
  useLayout();
const tabs = useStore();
const route = useRoute();
const router = useRouter();
const userDropdownOpen = ref(false);
const keepalive = ref(null);
const mapList = new Map();
const pageKey = computed(() => route.fullPath.substring(1) || "home");
const resetPasswordState = ref(false);

/** keep-alive 的 include 不能与 HTML 保留标签同名（如 menu） */
const RESERVED_COMPONENT_NAMES = new Set([
  "menu",
  "object",
  "main",
  "header",
  "footer",
  "form",
  "table",
  "template",
  "select",
  "option",
  "colgroup",
  "caption",
  "map",
  "link",
  "style",
  "title",
]);

function toCacheComponentName(path) {
  if (!path) return path;
  const leaf = path.includes("/")
    ? path.slice(path.lastIndexOf("/") + 1)
    : path;
  if (RESERVED_COMPONENT_NAMES.has(leaf.toLowerCase())) {
    return `View_${path.replace(/\//g, "_")}`;
  }
  return path;
}

const handleComponent = (Component) => {
  if (!Component) return null;
  const fullPath = route.fullPath.substring(1) || "home";
  const cacheName = toCacheComponentName(fullPath);
  let comPath = mapList.get(fullPath);
  if (!comPath) {
    comPath = { name: cacheName, render: () => h(Component) };
    mapList.set(fullPath, comPath);
  } else {
    comPath.render = () => h(Component);
  }
  return comPath;
};

usePerm();

const includeList = computed(() => {
  return tabs.tabs.map((e) => toCacheComponentName(e.path));
});

const handlePath = (item) => {
  router.push(`/${item}`);
};

const targetPath = ref("");

const handleDel = async (index, state) => {
  if (tabs.tabs.length === 1) return;
  const res = await tabs.syncDelTabs(index);
  if (!res) return;
  if (state) {
    const i = index > tabs.tabs.length - 1 ? tabs.tabs.length - 1 : index;
    router.push("/" + tabs.tabs[i].path);
  }
};

const handleRefresh = () => {
  location.reload();
};

watch(
  route,
  (newData) => {
    if (
      ["/"].includes(router.currentRoute.value.path) ||
      router.currentRoute.value.query.routerChange
    ) {
      router.replace({ path: "/home" });
      return;
    }
    if (router.hasRoute(newData.name)) {
      targetPath.value = newData.fullPath.substring(1);
      tabs.setTabs(targetPath.value, newData);
    }
  },
  { deep: true, immediate: true },
);
watch(
  () => userData.value.mustChangePassword,
  (newData) => {
    resetPasswordState.value = newData === 1;
  },
);
</script>

<style scoped lang="scss">
.contract-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-width: 1200px;
  min-height: 600px;
  overflow: auto;
  background: linear-gradient(180deg, #e8f1ff, #f7f8fa 20%, #f7f8fa 10%);
}

.contract-header {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  height: 56px;
  padding: 0 24px;
  background: #1f2e54;
  color: #fff;

  .contract-header__logo {
    width: 119px;
    height: 32px;
    object-fit: contain;
    flex-shrink: 0;
    color: #fff;
  }

  .contract-header__title {
    font-weight: 500;
    font-size: 15px;
    color: #ffffff;
    margin-left: 16px;
  }
}

.contract-layout__main {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.contract-layout__body {
  height: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  position: relative;
}

.contract-layout__view {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
</style>

<style lang="scss" scoped>
.tab-list {
  display: flex;
  font-weight: 400;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.65);
  margin-top: 8px;
  width: 100%;
  overflow-x: auto;
  flex-wrap: nowrap;
  background: rgba(255, 255, 255, 0.25);

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.12);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-track-piece {
    background: transparent;
  }
}

.tab-item {
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 9px 16px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 4px 4px 0px 0px;
  margin-right: 1px;
  flex-shrink: 0;
  white-space: nowrap;

  // &:first-child {
  //   background: #1F2E54;
  //   color: #fff;

  //   .tab-item__close {
  //     color: #fff;
  //   }
  // }

  .tab-item__close {
    margin-left: 8px;
    font-size: 13px;
  }

  &.active {
    background: transparent;
    font-weight: 500;
    background: var(--color-primary);
    color: #fff;

    .tab-item__close {
      color: #fff;
    }
  }
}

.tab-item__close {
  padding: 2px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.35);
  cursor: pointer;
  font-weight: 600;

  &:hover {
    color: #ff4d4f;
  }
}

.header-actions__item {
  .iconfont {
    font-size: 30px;
    position: relative;

    .selected-dot {
      width: 6px;
      height: 6px;
      background: #e34d59;
      border-radius: 50%;
      position: absolute;
      right: 3px;
      top: 3px;
      z-index: 1;
    }
  }
}

.contract-header__actions {
  height: 100%;
  display: flex;
  align-items: center;

  .contract-header__user {
    height: 100%;
    display: flex;
    align-items: center;
  }

  .layout-menu__down-icon {
    margin-left: 4px;
    transform: rotate(0deg);
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);

    &.is-open {
      transform: rotate(180deg);
    }
  }
}

.anticon-down {
  font-size: 12px !important;
}
</style>
