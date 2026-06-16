<template>
  <div class="flex" style="max-width:100%;width:fit-content;">
    <div @click="handleDownload" class="flex-1 flex hover-text align-center" style="min-width: 0">
      <PaperClipOutlined style="margin-right: 5px" />
      <div class="flex flex-1 align-center" style="min-width: 0">
        <div v-for="(part, pi) in fileNames(item)" :key="pi" :class="pi === 0 ? 'text-ellipsis-1' : ''">
          {{ part }}
        </div>
      </div>
    </div>
    <div>
      <slot name="right"></slot>
    </div>
  </div>
</template>

<script setup>
import { defineProps, watch, ref, reactive } from 'vue';
import { fileNames, downloadFile } from "@/utils/preview.js";
import { PaperClipOutlined } from '@ant-design/icons-vue'
defineOptions({
  name: ''
})
const props = defineProps({
  item: {
    type: String,
    default: "",
  },
  isDownload: {
    type: Boolean,
    default: false,
  },
})
const handleDownload = () => {
  if (props.isDownload) {
    downloadFile(props.item)
  }
}
</script>

<style lang="scss" scoped>
.text-ellipsis-1 {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: fit-content;
}
</style>
