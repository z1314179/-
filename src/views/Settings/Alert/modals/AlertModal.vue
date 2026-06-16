<template>
  <a-modal
    :title="detailsInfo.id ? '编辑预警' : '新增预警'"
    width="642px"
    okText="保存"
    :mask-closable="false"
    :open="open"
    @cancel="handleCancel"
    @ok="handleOk"
    wrapClassName="alert-modal"
  >
    <a-form
      class="form-meta-form pd-l-small pd-y-small"
      ref="formRef"
      :model="formState"
      :rules="formRules"
      :label-col="{ style: { width: '77px' } }"
    >
      <a-form-item label="预警名称" name="name">
        <a-input v-model:value="formState.name" placeholder="请输入" />
      </a-form-item>
      <a-form-item label="预警类型" name="type">
        <a-select
          v-model:value="formState.type"
          :options="alertTypeList.arr"
          allow-clear
          placeholder="请选择"
          style="width: 260px"
        >
        </a-select>
      </a-form-item>
      <div class="flex">
        <a-form-item label="预警规则" name="ruleType">
          <a-select
            v-model:value="formState.ruleType"
            :options="alertRuleList.arr"
            allow-clear
            placeholder="请选择"
            style="width: 115px"
          >
          </a-select>
        </a-form-item>
        <a-form-item name="warningDays" class="mg-l-small">
          <div class="flex align-center">
            <a-input-number
              v-model:value="formState.warningDays"
              style="width: 115px"
              placeholder="请输入"
              :controls="false"
              :precision="0"
            />
            <div class="mg-l-small">天</div>
          </div>
        </a-form-item>
      </div>
      <a-form-item label="适用部门" name="deptIdArray">
        <cascaderCheck
          v-model:value="formState.deptIdArray"
          :options="deptList"
          :field-names="{
            children: 'children',
            label: 'name',
            value: 'id',
          }"
          multiple
          show-search
          allow-clear
          check-strictly
          tree-default-expand-all
          tree-node-filter-prop="name"
          show-checked-strategy="SHOW_ALL"
          placeholder="请选择"
        />
      </a-form-item>
      <a-form-item label="是否生效" name="status">
        <a-radio-group v-model:value="formState.status">
          <a-radio
            v-for="item in alertStatusList.arr"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </a-radio>
        </a-radio-group>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup>
import { ref, watch } from "vue";
import { message } from "ant-design-vue";
import { addAlert, updateAlert } from "@/api/Settings/alert.js";
import useTabs from "@/hook/useTabs.js";
import hookMap from "@/views/Settings/hookMap";
import CascaderCheck from "@/components/system/cascaderCheck.vue";

defineOptions({ name: "AlertModal" });

const { deptList } = useTabs({ dept: true });
const { alertTypeList, alertStatusList, alertRuleList } = hookMap();

const props = defineProps({
  open: Boolean,
  detailsInfo: Object,
});

const emit = defineEmits(["update:open", "change"]);
const loading = ref(false);

let formData = {
  name: "",
  type: undefined,
  status: 1,
  ruleType: undefined,
  warningDays: 1,
  deptIdArray: undefined,
};
const formState = ref({ ...formData });
const formRef = ref(null);
const formRules = ref({
  name: [
    {
      required: true,
      message: "请输入预警名称",
    },
  ],
  type: [
    {
      required: true,
      message: "请选择预警类型",
    },
  ],
  ruleType: [
    {
      required: true,
      message: "请选择预警规则",
      trigger: "change",
    },
  ],
  warningDays: [
    {
      required: true,
      message: "请输入天数",
      trigger: "change",
    },
  ],
  deptIdArray: [
    {
      required: true,
      message: "请选择部门",
      trigger: "change",
    },
  ],
  status: [
    {
      required: true,
      message: "请选择生效状态",
      trigger: "change",
    },
  ],
});
const handleCancel = () => {
  formState.value = { ...formData };
  formRef.value.resetFields();
  emit("update:open", false);
};

const apiFunctions = async (data) => {
  return props.detailsInfo.id
    ? await updateAlert(props.detailsInfo.id, data)
    : await addAlert(data);
};

const handleOk = async () => {
  await formRef.value.validate();
  try {
    loading.value = true;
    const params = { ...formState.value };
    const res = await apiFunctions(params);
    loading.value = false;
    if (res.errno === 0) {
      message.success("保存成功");
      emit("change");
      handleCancel();
    }
  } catch (error) {
    loading.value = false;
  }
};
const init = () => {
  if (props.detailsInfo.id) {
    for (const key in formState.value) {
      formState.value[key] = props.detailsInfo[key];
    }
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
.alert-modal {
}
</style>
