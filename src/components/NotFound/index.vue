<template>
  <div class=" flex align-center justify-center">
    <div style="font-size: 32px; font-weight: 900"></div>
    <i class="pd-y-large"></i>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
defineOptions({
  name: "notFound",
});
const router = useRouter();
</script>

<style lang="scss" scoped></style>
