<template>
  <div class="bank-card flex flex-column">
    <slot name="card-title"></slot>
    <div class="card-content">
      <div class="flex">
        <span class="label">开户银行</span>
        <span class="value flex-1">{{ data.accountOpen }}</span>
        <slot name="content-right"></slot>
      </div>
      <div class="flex">
        <span class="label">开户支行</span>
        <span class="value flex-1">{{ data.accountOpenBranch }}</span>
      </div>
      <div class="flex">
        <span class="label">银行账号</span>
        <span class="value flex-1">{{ data.accountNumber }}</span>
      </div>
      <div class="flex">
        <span class="label">账户名称</span>
        <span class="value flex-1">{{ data.accountName }}</span>
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
.bank-card {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
  border: 1px solid #d9d9d9;
  padding: 10px;
  width: 400px;
  .card-content {
    & > * {
      padding: 5px 0;
      line-height: 20px;
    }
    & > :last-child {
      padding-bottom: 0;
    }
    & > :first-child {
      padding-top: 0;
    }
  }
  .label {
    font-weight: 400;
    font-size: 14px;
    color: rgba(0, 0, 0, 0.45);
    width: 76px;
    flex-shrink: 0;
  }
  .value {
    word-break: break-all;
    word-break: break-all;
    overflow-wrap: break-word;
  }
}
</style>
