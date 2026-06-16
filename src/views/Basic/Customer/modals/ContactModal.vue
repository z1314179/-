<template>
  <a-modal
    :title="detailsInfo.name ? '编辑联系人' : '新增联系人'"
    width="520px"
    okText="保存"
    :mask-closable="false"
    :open="open"
    @cancel="handleCancel"
    @ok="handleOk"
  >
    <a-form
      ref="formRef"
      class="form-class"
      :model="formState"
      :rules="formRules"
      :label-col="{ style: { width: '79px' } }"
    >
      <a-form-item label="姓名" name="name">
        <a-input
          v-model:value="formState.name"
          placeholder="请输入"
          :maxlength="200"
          allow-clear
        />
      </a-form-item>
      <a-form-item label="职位" name="position" v-if="type === 1">
        <a-input
          v-model:value="formState.position"
          placeholder="请输入"
          :maxlength="200"
          allow-clear
        />
      </a-form-item>
      <a-form-item label="联系电话" name="mobile">
        <a-input
          v-model:value="formState.mobile"
          placeholder="请输入"
          :maxlength="200"
          allow-clear
        />
      </a-form-item>
      <a-form-item label="邮箱" name="email">
        <a-input
          v-model:value="formState.email"
          placeholder="请输入"
          :maxlength="200"
          allow-clear
        />
      </a-form-item>
      <a-form-item label="联系地址" name="address">
        <a-input
          v-model:value="formState.address"
          placeholder="请输入"
          :maxlength="200"
          allow-clear
        />
      </a-form-item>
      <a-form-item label="授权代表" name="isAuthorize" required>
        <a-radio-group v-model:value="formState.isAuthorize">
          <a-radio :value="1">是</a-radio>
          <a-radio :value="0">否</a-radio>
        </a-radio-group>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup>
import { computed, watch, ref } from "vue";
import { message } from "ant-design-vue";

defineOptions({ name: "DataTypeModal" });

const props = defineProps({
  open: Boolean,
  type: [String, Number], // 客商类型 1: 公司 2: 个人 3: 达人
  detailsInfo: Object,
});

let formData = {
  name: "",
  mobile: "",
  position: "",
  email: "",
  address: "",
  isAuthorize: 0,
};
const formState = ref({ ...formData });
const formRef = ref(null);
const formRules = ref({
  name: [{ required: true, message: "请输入姓名", trigger: "change" }],
  mobile: [{ required: true, message: "请输入联系电话", trigger: "change" }],
  address: [{ required: true, message: "请输入联系地址", trigger: "change" }],
});

const emit = defineEmits(["update:open", "change"]);
const handleCancel = () => {
  formState.value = { ...formData };
  formRef.value.resetFields();
  emit("update:open", false);
};

const handleOk = async () => {
  await formRef.value.validate();
  emit("change", formState.value);
  handleCancel();
};
const handleOpen = () => {
  if (props.detailsInfo.name) {
    formState.value = { ...props.detailsInfo };
  }
};

watch(
  () => props.open,
  (newValue, oldValue) => {
    if (newValue) {
      handleOpen();
    }
  },
);
</script>
<style lang="scss" scoped>
.form-class {
  .ant-form-item {
    margin-bottom: 16px;
    &:last-child {
      margin-bottom: 0px;
    }
  }
}
</style>
