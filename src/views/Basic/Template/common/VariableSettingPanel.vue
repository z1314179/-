<template>
  <div class="setting-panel">
    <a-checkbox v-for="(item, index) in pagedOptions" :key="index" v-model:checked="item.checked">{{ item.props.label
      }}</a-checkbox>
    <div class="setting-panel__pagination flex align-center">
      <div style=" color: rgba(0,0,0,0.6);width: 68px;">共 {{ options.length }} 条</div>
      <a-select style="margin-right: 8px;" v-model:value="pageSize" size="small" :options="pageSizeOptions" />
      <a-pagination ref="paginationRef" v-model:current="currentPage" @change="onChange" v-model:pageSize="pageSize"
        simple :total="options.length" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from "vue";

defineOptions({
  name: "VariableSettingPanel",
});
const pageSize = ref(10);
const pageSizeOptions = [
  { label: '10条/页', value: 10 },
  { label: '20条/页', value: 20 },
  { label: '50条/页', value: 50 },
];
const props = defineProps({
  options: {
    type: Array,
    default: () => [],
  },
});
const paginationRef = ref(null);
const emit = defineEmits(["update:checkedList"]);
const currentPage = ref(1);
const pagedOptions = computed(() => {
  return props.options.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
});
const onChange = (page, pageSize) => {
  // console.log(page, pageSize);

};
onMounted(() => {
  paginationRef.value.$el.querySelector('.ant-pagination-simple-pager input').addEventListener('change', (e) => {
    let num = Math.ceil(props.options.length / pageSize.value);
    if (e.target.value > num) {
      e.target.value = num;
    }
    currentPage.value = Number(e.target.value);
  });
});
</script>

<style scoped lang="scss">
.setting-panel {
  background: rgba(0, 0, 0, 0.03);
  border-radius: 6px;
  padding: 4px 2px;



  .ant-checkbox-wrapper {
    margin: 6px 8px;
  }
}

.setting-panel__pagination {
  font-size: 12px;
  padding: 6px 10px;

  :deep(.ant-select) {
    width: 88px;
    height: 24px;

    .ant-select-selection-item {
      font-size: 12px;

    }

    .ant-select-arrow {
      font-size: 10px;
    }
  }

  :deep(.ant-pagination-simple-pager) {

    width: 102px;
    background: #EEEEEE;
    border-radius: 3px;
    border: 1px solid #DCDCDC;
    box-sizing: border-box;

    >input {
      margin: 0;
      padding: 0;
      width: 50px;
      border: none;
      border-radius: 3px 0px 0px 3px;
    }

    .ant-pagination-slash {
      margin: 0;
      padding-left: 12px;

    }
  }
}
</style>
