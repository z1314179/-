<template>
  <a-modal
    title="选择公司主体"
    destroyOnClose
    :maskClosable="false"
    :open="visible"
    width="350px"
    :footer="null"
    @cancel="handleCancel"
  >
    <div class="mainPart-body">
      <a-table
        :dataSource="list"
        :showHeader="false"
        size="medium"
        :pagination="false"
        :columns="columns"
        rowKey="id"
        :customRow="rowEvents"
      >
      </a-table>
    </div>
  </a-modal>
</template>

<script setup>
import { defineProps, watch, ref, reactive } from "vue";
defineOptions({
  name: "",
});
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  list: {
    type: Array,
    default: [],
  },
});
const emit = defineEmits(["update:visible", "change"]);
const handleCancel = () => {
  emit("update:visible", false);
};
const columns = [
  {
    title: "主体",
    dataIndex: "name",
    key: "name",
  },
];
const rowEvents = (record) => {
  return {
    onClick: () => {
      emit("change", record);
      handleCancel();
    },
  };
};
</script>

<style lang="scss" scoped>
.mainPart-body {
  max-height: 250px;
  margin: 8px 0 16px;
  overflow: auto;
  :deep(.ant-table-cell) {
    padding: 12px 8px !important;
  }
  :deep(.ant-table) {
    .ant-table-tbody {
      .ant-table-row:nth-child(odd) {
        background: #fafafa;
      }
    }
  }

  &::-webkit-scrollbar {
    width: 5px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 10px;
  }

  &::-webkit-scrollbar-track-piece {
    background: transparent;
  }
}
</style>
