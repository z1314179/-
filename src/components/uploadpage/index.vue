<template>
  <div>
    <Upload @change="change"><a-button>Add</a-button></Upload>
    <div class="flex flex-wrap" style="padding: 8px;background: #f0f0f0">
      <ImgView
        style="padding: 8px"
        v-for="(item, index) in files"
        :key="index"
        :item="item"
        width="100px"
        height="100px"
      ></ImgView>
    </div>
  </div>
</template>

<script setup>
import Upload from "@/components/upload/index.vue";
import ImgView from "@/components/upload/imgView.vue";
import { ref } from "vue";
const files = ref([]);
const change = (e) => {
  files.value.push(e);
};
</script>

<style lang="scss" scoped>
</style>
