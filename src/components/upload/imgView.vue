<template>
  <div>
    <div class="hover-image" :style="`width:${width}; height: ${height}`">
      <a-image v-if="fileType === '.pdf'" :preview="false" :src="pdfImg" />
      <a-image
        v-else-if="['.doc', '.docx'].includes(fileType)"
        :preview="false"
        :src="docImg"
      />
      <a-image
        v-else-if="
          ['.xlsx', '.xls', '.xlsb', '.xlsm', '.xlst', '.csv'].includes(
            fileType
          )
        "
        :preview="false"
        :src="excelImg"
      />
      <a-image
        fit="fit"
        v-else-if="
          ['.gif', '.jpg', '.jpeg', '.png', '.gif', '.jpg', '.png'].includes(
            fileType
          )
        "
        :preview="false"
        :src="fileItem"
      />
      <a-image v-else :preview="false" :src="zipImg" />
      <div class="shade" v-if="fileType">
        <span
          class="iconfont icon-shanchu"
          v-if="
            ['.gif', '.jpg', '.jpeg', '.png', '.gif', '.jpg', '.png'].includes(
              fileType
            )
          "
          @click.stop="handleShow"
        ></span>
        <span
          class="iconfont icon-bumen"
          v-else
          @click.stop="bulkDownload"
        ></span>
      </div>
    </div>
    <div style="display: none">
      <a-image-preview-group
        :preview="{ visible, onVisibleChange: (vis) => (visible = vis) }"
      >
        <a-image :src="fileItem" />
      </a-image-preview-group>
    </div>
  </div>
</template>
<script setup>
import pdfImg from "@/assets/imgs/pdf.png";
import docImg from "@/assets/imgs/doc.png";
import excelImg from "@/assets/imgs/excel.png";
import zipImg from "@/assets/imgs/zip.png";
import { watch, ref, reactive, defineProps, computed } from "vue";
defineOptions({
  name: "",
});
const props = defineProps({
  item: {
    type: String,
    default: "",
  },
  width: {
    type: String,
    default: "100%",
  },
  height: {
    type: String,
    default: "100%",
  },
});
const visible = ref(false);
const fileItem = computed(() => {
  if (props.item.startsWith("http")) {
    return props.item;
  }
  return process.env.IMG + props.item;
});
const fileType = computed(() => {
  if (!props.item) return false;
  let fileName = props.item;
  let pos = fileName.lastIndexOf(".");
  if (pos > 0) {
    let lastName = fileName.substring(pos, fileName.length);
    return lastName;
  } else {
    return false;
  }
});
const handleShow = () => {
  visible.value = true;
};
const bulkDownload = () => {
  window.open(fileItem.value, "_blank");
};
</script>

<style lang="scss" scoped>
:deep(.hover-image) {
  position: relative;
  .ant-image {
    width: 100%;
    height: 100%;
  }
  &:hover {
    .shade {
      display: flex;
    }
  }
  .shade {
    display: none;
    z-index: 999;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 5px;
    align-items: center;
    justify-content: center;
    > span {
      cursor: pointer;
      color: #fff;
      font-size: 14px;
      font-weight: bold;
      padding: 5px;
      &:hover {
        color: red !important;
      }
    }
  }
}
</style>
