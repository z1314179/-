<template>
  '弃用'
  <div class="flex" style="width:367px" @click="$emit('click', item)">
    <div class="upload-file-row__left flex-1 flex hover-text" style="min-width: 0;">
      <PaperClipOutlined style="margin-right: 5px;" />
      <div class="flex flex-1 align-center" style="min-width: 0;">
        <div v-for="(value, index) in fileNames(item)" :key="index" :class="index === 0 ? 'text-ellipsis' : ''">
          {{ value }}
        </div>
      </div>
    </div>
    <div class="pd-l-medium flex align-center">
      <i @click="handleDownload(item)" v-if="showDownload" class="iconfont icon-xiazai" style="color:rgba(0,0,0,0.45)">
      </i>
      <i @click.stop="$emit('remove', item, index)" v-if="showRemove" class="iconfont icon-guanbi1 mg-l-small"
        style="font-size: 20px;color:rgba(0,0,0,0.45)">
      </i>
    </div>
  </div>
</template>

<script setup>
defineOptions({
  name: "UploadFileRow",
});

import { computed } from "vue";
import { CloseOutlined, PaperClipOutlined } from "@ant-design/icons-vue";
import { fileNames, downloadFile } from "@/utils/preview.js";

const props = defineProps({
  item: {
    type: [String, Object],
    default: "",
  },
  showRemove: {
    type: Boolean,
    default: true,
  },
  showDownload: {
    type: Boolean,
    default: true,
  },
});

const $emit = defineEmits(['remove'])
const handleDownload = (item) => {
  downloadFile(item)
}

</script>

<style scoped lang="scss"></style>
