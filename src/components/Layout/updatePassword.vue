<template>
  <a-modal
    title="修改密码"
    destroyOnClose
    :maskClosable="false"
    :open="visible"
    width="560px"
    okText="确定"
    @cancel="handleCancel"
  >
    <a-form
      ref="formRef"
      :model="formState"
      class="mg-t-small"
      layout="vertical"
      :label-col="{ style: { width: '85px' } }"
      autocomplete="off"
    >
      <a-form-item
        label="组织编码"
        name="organizationNo"
        :rules="[{ required: true, message: '此为必填项' }]"
      >
        <a-input
          v-model:value="formState.organizationNo"
          placeholder="请输入"
          allowClear
          style="width: 393px"
        />
      </a-form-item>
      <a-form-item
        label="组织"
        name="name"
        :rules="[{ required: true, message: '此为必填项' }]"
      >
        <a-input
          v-model:value="formState.name"
          placeholder="请输入"
          allowClear
          style="width: 393px"
        />
      </a-form-item>
    </a-form>
    <template #footer>
      <a-button @click="handleCancel">取 消</a-button>
      <a-button type="primary" @click="handleOk">保 存</a-button>
    </template>
  </a-modal>
</template>

<script setup>
import { defineProps, watch, ref, reactive, defineEmits } from "vue";
import { addDepartment, updateDepartment } from "@/api/users";
import { message } from "ant-design-vue";
defineOptions({
  name: "",
});
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  rowData: {
    type: Object,
  },
});
watch(
  () => props.visible,
  (newValue, oldValue) => {
    if (newValue) {
      afterOpenChange();
    } else {
    }
  }
);
const emit = defineEmits(["update:visible", "refresh"]);
const formRef = ref(null);
const formState = ref({});
const title = ref("新增");
const handleOk = async () => {
  await formRef.value.validate();
  let res = {};
  if (formState.value.id) {
    res = await updateDepartment({ ...formState.value });
  } else {
    res = await addDepartment({ ...formState.value });
  }
  if (res.errno == 0) {
    message.success("操作成功");
    emit("refresh");
    handleCancel();
  }
};
const handleCancel = () => {
  emit("update:visible", false);
  formRef.value.resetFields();
};
const afterOpenChange = (val) => {};
</script>

<style lang="scss" scoped>
</style>
