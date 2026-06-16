<template>
  <div class="emptyInfo">
    <div style="text-align: center">
      <img src="@/assets/imgs/empty.png" style="max-width: 320px; width: 100%; height: 100%" alt="" srcset="" />
      <div class="emptyInfo-content">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
defineOptions({
  name: "",
});
</script>

<style lang="scss" scoped>
.emptyInfo {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;

  .emptyInfo-content {
    color: rgba(0, 0, 0, 0.25);
    font-size: 14px;
    padding-top: 4px;
  }
}
</style>
