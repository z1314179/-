<template>
  <a-modal
    title="详情"
    width="642px"
    :mask-closable="false"
    :open="open"
    @cancel="handleCancel"
    wrapClassName="alert-modal"
  >
    <a-form
      class="info_form pd-x-medium"
      :label-col="{ style: { width: '70px' } }"
    >
      <a-form-item label="预警名">
        {{ detailsInfo.name || "-" }}
      </a-form-item>
      <a-form-item label="预警类型">
        {{ alertTypeList.obj[detailsInfo.type]?.label || "-" }}
      </a-form-item>
      <a-form-item label="预警规则">
        {{ alertRuleList.obj[detailsInfo.ruleType]?.label || "-" }}
        {{ detailsInfo.warningDays || 0 }}天
      </a-form-item>
      <a-form-item label="适用部门">
        {{ detailsInfo.deptNameArray?.join("；") || "-" }}
      </a-form-item>
      <a-form-item label="是否生效">
        <span :class="detailsInfo.status === 1 ? 'text-green' : 'text-red'">
          {{ alertStatusList.obj[detailsInfo.status]?.label || "-" }}
        </span>
      </a-form-item>
    </a-form>
    <template #footer>
      <a-button @click="handleCancel">关闭</a-button>
    </template>
  </a-modal>
</template>

<script setup>
import { ref, watch } from "vue";
import useTabs from "@/hook/useTabs.js";
import hookMap from "@/views/Settings/hookMap";
import CascaderCheck from "@/components/system/cascaderCheck.vue";

defineOptions({ name: "AlertDetailsModal" });

const { deptList } = useTabs({ dept: true });
const { alertTypeList, alertStatusList, alertRuleList } = hookMap();

const props = defineProps({
  open: Boolean,
  detailsInfo: Object,
});

const emit = defineEmits(["update:open"]);

const handleCancel = () => {
  emit("update:open", false);
};
</script>
<style lang="scss" scoped>
.alert-modal {
  .text-green {
    color: #30a46c;
  }
  .text-red {
    color: #ee245e;
  }
}
</style>
