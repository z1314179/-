<template>
  <div class="contact-card flex flex-column">
    <slot name="card-title"></slot>
    <div class="card-content">
      <div class="flex">
        <i class="iconfont icon-lianxidianhua" />
        <span class="value flex-1">{{ data.mobile }}</span>
      </div>
      <div class="flex">
        <i class="iconfont icon-youxiang" />
        <span class="value flex-1">{{ data.email }}</span>
      </div>
      <div class="flex">
        <i class="iconfont icon-dizhi" />
        <a-tooltip :title="data.address">
          <span class="value text-ellipsis">{{ data.address }}</span>
        </a-tooltip>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  data: Object,
});
</script>

<style lang="scss" scoped>
.contact-card {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
  border: 1px solid #d9d9d9;
  padding: 10px;
  width: 400px;
  font-size: 12px;
  .card-content {
    & > * {
      padding: 1px 0;
      line-height: 17px;
    }
    & > :last-child {
      padding-bottom: 0;
    }
    & > :first-child {
      padding-top: 0;
    }
  }
  .value {
    padding-left: 8px;
    word-break: break-all;
    overflow-wrap: break-word;
  }
}
</style>
