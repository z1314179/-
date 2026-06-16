<template>
  <div>
    <a-config-provider :theme="theme" :locale="zhCN">
      <router-view></router-view>
      <template #renderEmpty>
        <div style="text-align: center">
          <img src="@/assets/imgs/empty.png" style="
              max-width: 320px;
              width: 100%;
            " alt="" srcset="" />
        </div>
      </template>
    </a-config-provider>
  </div>
</template>

<script setup>
import zhCN from "ant-design-vue/es/locale/zh_CN";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
dayjs.locale("zh-cn");
import { computed } from 'vue';
defineOptions({
  name: "",
});
const theme = computed(() => {
  return {
    token: {
      colorPrimary: '#1677FF',
      colorLink: '#1677FF',
      colorText: 'rgba(0,0,0,0.85)',
      colorTextPlaceholder: 'rgba(0,0,0,0.26)',
      // colorTextDisabled: 'rgba(0,0,0,0.85)',
      borderRadius: 4,
      colorError: '#EE245E',
      fontFamily: 'PingFangSC, PingFang SC',
      // Select 等：选项高亮行背景（与 Menu 无关；Menu 悬停见 components.Menu.colorItemBgHover 或 token.colorBgTextHover）
      controlItemBgHover: '#e6f4ff',
      // Select 等：已选中项背景；Menu 选中项背景也来自该值（Menu 内 colorItemBgSelected → controlItemBgActive）
      controlItemBgActive: '#e6f4ff',
    },
    components: {
      Table: {
        colorTextHeading: 'rgba(0,0,0,0.85)',
        colorText: 'rgba(0,0,0,0.85)'
      },
      // Menu：悬停项背景默认等于 token.colorBgTextHover；在此单独设可避免改全局 colorBgTextHover
      Menu: {
        colorItemBgHover: '#e6f4ff',
        colorItemBgSelected: '#e6f4ff',
      },
    },
  }
});
</script>

<style lang="scss" scoped></style>
