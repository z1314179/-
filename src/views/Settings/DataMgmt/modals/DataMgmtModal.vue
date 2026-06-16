<template>
  <a-modal
    :title="openId ? '编辑' : '新增'"
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
      <a-form-item label="处理类型" name="type">
        <a-radio-group v-model:value="formState.type">
          <a-radio
            v-for="item in dealTypeList.arr"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </a-radio>
        </a-radio-group>
      </a-form-item>
      <a-form-item label="移交人" name="transferUserId">
        <a-select
          v-model:value="formState.transferUserId"
          :options="userOptions"
          :fieldNames="{ label: 'userName', value: 'id' }"
          :filter-option="filterOption"
          allow-clear
          show-search
          placeholder="请选择"
          style="width: 260px"
        >
        </a-select>
      </a-form-item>
      <a-form-item label="被移交人" name="acceptUserId">
        <a-select
          v-model:value="formState.acceptUserId"
          :options="userOptions"
          :fieldNames="{ label: 'userName', value: 'id' }"
          :filter-option="filterOption"
          allow-clear
          show-search
          placeholder="请选择"
          style="width: 260px"
        >
        </a-select>
      </a-form-item>
      <a-form-item label="生效日期" name="effectDate">
        <a-date-picker
          v-model:value="formState.effectDate"
          :disabled-date="
            (current) => {
              return current && current < dayjs().startOf('day');
            }
          "
          valueFormat="YYYY-MM-DD"
          format="YYYY-MM-DD"
          allow-clear
          placeholder="请选择"
          style="width: 260px"
        />
      </a-form-item>
      <a-form-item label="移交理由">
        <a-textarea
          v-model:value="formState.reason"
          :auto-size="{ minRows: 2 }"
          :maxlength="500"
          allow-clear
          placeholder="请输入"
          style="width: 328px"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup>
import { ref, watch } from "vue";
import { message } from "ant-design-vue";
import {
  getDataMgmtDetail,
  addDataMgmt,
  updateDataMgmt,
} from "@/api/Settings/dataMgmt.js";
import { getTableList } from "@/api/users";
import dayjs from "dayjs";
import hookMap from "@/views/Settings/hookMap";

defineOptions({ name: "DataMgmtModal" });

const { dealTypeList } = hookMap();

const props = defineProps({
  open: Boolean,
  openId: [String, Number],
});

const emit = defineEmits(["update:open", "change"]);
const loading = ref(false);
const userOptions = ref([]);

let formData = {
  type: 1,
  transferUserId: undefined,
  acceptUserId: undefined,
  effectDate: undefined,
  reason: "",
};
const formState = ref({ ...formData });
const formRef = ref(null);
const formRules = ref({
  transferUserId: [
    {
      required: true,
      message: "请选择移交人",
      trigger: "change",
    },
  ],
  acceptUserId: [
    {
      required: true,
      message: "请选择被移交人",
      trigger: "change",
    },
  ],
  effectDate: [
    {
      required: true,
      message: "请选择生效日期",
      trigger: "change",
    },
  ],
});

const filterOption = (input, option) => {
  return option.userName.toLowerCase().indexOf(input.toLowerCase()) >= 0;
};

const handleCancel = () => {
  formState.value = { ...formData };
  formRef.value.resetFields();
  emit("update:open", false);
};

const getTableListData = async () => {
  const { data } = await getTableList({ isAll: 1 });
  userOptions.value = data || [];
};

const apiFunctions = async (data) => {
  return props.openId ? await updateDataMgmt(data) : await addDataMgmt(data);
};

const handleOk = async () => {
  await formRef.value.validate();
  try {
    loading.value = true;
    const params = { ...formState.value };
    if (props.openId) {
      params.id = props.openId;
    }
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
const init = async () => {
  await getTableListData();
  if (props.openId) {
    const { data } = await getDataMgmtDetail({ id: props.openId });
    for (const key in formState.value) {
      formState.value[key] = data[key];
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
