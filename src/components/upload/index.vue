<template>
  <div>
    <a-upload
      action="#"
      :before-upload="customRequest"
      :show-upload-list="false"
    >
      <slot></slot>
    </a-upload>
  </div>
</template>

<script setup>
defineOptions({
  name: "",
});
const $emit = defineEmits(["change"]);
import useUpload from "./useUpload.js";
const { uploadFile, setp } = useUpload();
const customRequest = async (file) => {
  const res = await uploadFile(file);
  $emit("change", res);
};
</script>

<style lang="scss" scoped></style>
