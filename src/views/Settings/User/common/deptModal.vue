<template>
  <a-modal :title="modalTitle" width="520px" okText="保存" cancelText="取消" :mask-closable="false" :open="open"
    @cancel="handleCancel" @ok="handleOk">
    <a-form ref="formRef" class="mg-t-small" :model="formState" :rules="formRules"
      :label-col="{ style: { width: '90px' } }">
      <a-form-item label="部门名称" name="name">
        <a-input style="width: 328px;" v-model:value="formState.name" placeholder="请输入" :maxlength="50" allow-clear />
      </a-form-item>
      <a-form-item label="钉钉部门ID" name="dingId" class="mg-b-small">
        <a-input style="width: 328px;" v-model:value="formState.dingId" placeholder="请输入" allow-clear />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { message } from "ant-design-vue";
import { addDepartment, updateDepartment } from "@/api/users";

defineOptions({ name: "deptModal" });

const props = defineProps({
  open: Boolean,
  deptInfo: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(["update:open", "change"]);

const formData = {
  id: undefined,
  name: "",
  dingId: "",
};
const formState = ref({ ...formData });
const formRef = ref(null);
const formRules = {
  name: [{ required: true, message: "请输入部门名称", trigger: "change" }],
  dingId: [{ required: true, message: "请输入钉钉部门ID", trigger: "change" }],
};

const modalTitle = computed(() => (props.deptInfo.type === "add" ? "添加子部门" : "编辑部门"));

const handleCancel = () => {
  formState.value = { ...formData };
  formRef.value?.resetFields();
  emit("update:open", false);
};

const handleOk = async () => {
  await formRef.value.validate();
  const { id, name, dingId } = formState.value;
  const res =
    props.deptInfo.type === "add"
      ? await addDepartment({ name, pid: props.deptInfo.id, dingId: dingId })
      : await updateDepartment({ id, name, dingId: dingId });
  if (res.errno === 0) {
    message.success("保存成功");
    emit("change");
    handleCancel();
  }
};

const handleOpen = () => {
  if (props.deptInfo.type === "add") {
    formState.value = { ...formData };
  } else {
    formState.value = {
      id: props.deptInfo.id,
      name: props.deptInfo.name || "",
      dingId: props.deptInfo.dingId || "",
    };
  }
};

watch(
  () => props.open,
  (val) => {
    if (val) {
      handleOpen();
    }
  },
);
</script>

<style lang="scss" scoped></style>
