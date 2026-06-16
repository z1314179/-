<template>
  <a-modal
    title="详情"
    width="500px"
    :mask-closable="false"
    :open="open"
    @cancel="handleCancel"
    wrapClassName="dataMgmt-details-modal"
  >
    <a-form
      class="info_form pd-x-medium"
      :label-col="{ style: { width: '70px' } }"
    >
      <a-form-item label="处理类型">
        {{ dealTypeList.obj[detailsInfo.type]?.label || "-" }}
      </a-form-item>
      <a-form-item label="移交人">
        {{ detailsInfo.transferUserName || "-" }}
      </a-form-item>
      <a-form-item label="被移交人">
        {{ detailsInfo.acceptUserName || "-" }}
      </a-form-item>
      <a-form-item label="生效日期">
        {{ detailsInfo.effectDate || "-" }}
      </a-form-item>
      <a-form-item label="移交理由">
        {{ detailsInfo.reason || "-" }}
      </a-form-item>
    </a-form>
    <template #footer>
      <a-button @click="handleCancel">关闭</a-button>
    </template>
  </a-modal>
</template>

<script setup>
import { ref, watch } from "vue";
import { getDataMgmtDetail } from "@/api/Settings/dataMgmt.js";
import hookMap from "@/views/Settings/hookMap";

defineOptions({ name: "DataMgmtDetailsModal" });

const { dealTypeList } = hookMap();

const props = defineProps({
  open: Boolean,
  openId: [String, Number],
});

const emit = defineEmits(["update:open"]);
const detailsInfo = ref({});

const handleCancel = () => {
  emit("update:open", false);
};
const init = async () => {
  if (props.openId) {
    const { data } = await getDataMgmtDetail({ id: props.openId });
    detailsInfo.value = data;
  }
};

watch(
  () => props.open,
  (newValue, oldValue) => {
    if (newValue) {
      init();
    }
  },
);
</script>
<style lang="scss" scoped>
.dataMgmt-details-modal {
}
</style>
