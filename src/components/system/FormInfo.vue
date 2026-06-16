<template>
  <div class="form_info_item">
    <div class="form_info_label" :style="{ width: labelWidth }"></div>
    <div class="form_info_content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  labelWidth: {
    type: String,
    default: "",
  },
});
defineOptions({
  name: "",
});
</script>

<style lang="scss" scoped>
.form_info_item {
  display: flex;
  .form_info_label {
  }
  .form_info_content {
    flex: 1;
    color: rgba(0, 0, 0, 0.45);
  }
}
</style>
