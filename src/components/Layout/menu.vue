<template>
  <div class="layout-menu">
    <a-menu class="layout-menu__inner" triggerSubMenuAction="hover" :popupOffset="[0, 0]" mode="horizontal"
      :selected-keys="selectedKeys" :items="items" @click="handleMenuItem" />
  </div>
</template>

<script setup>
defineOptions({ name: 'LayoutHeaderMenu' })

import { useMenu } from './useMenu.js'

const { selectedKeys, items, handleMenuItem } = useMenu()
</script>

<style scoped lang="scss">
.layout-menu {
  width: 100%;
  height: 100%;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  margin-left: 16px;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.12);
    border-radius: 4px;
  }

  :deep(.layout-menu__inner) {
    flex: 1;
    height: 100%;
    line-height: normal;
    display: flex;
    align-items: center;
    background: transparent;

    .ant-menu-item-active,
    .ant-menu-submenu-active,
    .ant-menu-submenu-selected,
    .ant-menu-item-selected {
      background: rgba(237, 241, 255, 0.3);
      border-radius: 2px;
    }

    .ant-menu-overflow-item {
      padding: 0 12px;
      height: 100%;

      &::after {
        display: none;
      }

      .ant-menu-submenu-title {
        height: 100%;
        display: flex;
        align-items: center;
      }

      .layout-menu__down-icon {
        display: inline-flex;
        margin-left: 2px;
        transform: rotate(0deg);
        transform-origin: center;
        transition: transform .18s cubic-bezier(0.4, 0, 0.2, 1);
      }

      &.ant-menu-submenu-active .layout-menu__down-icon {
        transform: rotate(180deg);
      }

      .ant-menu-title-content {
        font-weight: 500;
        font-size: 16px;
        padding: 0;
        margin: 0;
        color: #FFFFFF;
        height: 100%;
        display: flex;
        align-items: center;
      }

      .ant-menu-item-icon {
        display: none;
      }
    }


  }
}

.anticon-down {
  font-size: 12px !important;
}
</style>
<style lang="scss">
.popupClassName_menu {
  .ant-menu-title-content {
    color: var(--text-color) !important;
  }

  .ant-menu {
    padding: 10px 8px !important;
  }

  .ant-menu-item {
    margin: 1px 0 !important;
    width: 100% !important;
    /* padding: 8px 16px; */
    padding: 8px 2px 8px 16px !important;
    border-radius: 2px !important;
    height: fit-content !important;
    line-height: normal !important;

    &.ant-menu-item-selected {
      // background: #EDF1FF !important;
    }
  }
}
</style>
