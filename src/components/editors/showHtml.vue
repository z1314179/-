<template>
  <div
    v-html="htmlContent"
    v-if="htmlContent"
    id="htmlContent"
    :class="isView ? '' : 'bgcolor'"
  ></div>
</template>

<script setup>
import "./index.scss"; // 引入 css
import { defineProps, watch, ref, reactive } from "vue";
defineOptions({
  name: "",
});
const props = defineProps({
  htmlContent: {
    type: String,
    default: "",
  },
  isView: {
    type: Boolean,
    default: false,
  },
});
</script>

<style lang="scss" scoped>
@import url("./index.scss");
.bgcolor {
  background: #f5f5f5;
  border-radius: 0px 0px 6px 6px;
  padding: 16px;
}
</style>
