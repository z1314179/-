<template>
  <div class="page-content">
    <div
      style="height: 100%"
      class="flex flex-column justify-center align-center"
    >
      <div style="width: 349px; height: 325px; position: relative;margin-top:8vh">
        <img
          src="@/assets/imgs/accomplish.png"
          style="width: 100%; height: 100%"
          alt=""
        />

        <b class="title"> {{ title }}</b>
      </div>

      <slot></slot>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    default: "操作成功",
  },
});
defineOptions({
  name: "",
});
</script>

<style lang="scss" scoped>
.title {
  position: absolute;
  bottom: 20px;
  left: 50%;
  z-index: 999;
  font-size: 16px;
  font-weight: 600;
  transform: translate(-50%, 0);
}
</style>
