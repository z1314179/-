<template>
  <a-modal
    title="重置密码"
    destroyOnClose
    :maskClosable="false"
    :closable="false"
    centered
    :open="open"
    width="400px"
  >
    <a-form
      ref="formRef"
      :model="formState"
      :label-col="{ style: { width: '75px' } }"
      autocomplete="off"
    >
      <a-form-item
        label="旧密码"
        name="oldPassword"
        :rules="[{ required: true, message: '请输入旧密码' }]"
      >
        <a-input-password
          placeholder="请输入密码"
          v-model:value="formState.oldPassword"
          autocomplete="current-password"
          aria-label="密码"
          style="width: 260px"
        />
      </a-form-item>
      <a-form-item
        label="新密码"
        name="newPassword"
        :rules="[{ required: true, message: '请输入密码' }]"
      >
        <a-input-password
          placeholder="请输入密码"
          v-model:value="formState.newPassword"
          autocomplete="current-password"
          aria-label="密码"
          style="width: 260px"
        />
      </a-form-item>
      <a-form-item
        label="确认密码"
        name="confirmPassword"
        :rules="[{ required: true, message: '请输入确认密码' }]"
      >
        <a-input-password
          placeholder="请输入确认密码"
          v-model:value="formState.confirmPassword"
          autocomplete="current-password"
          aria-label="密码"
          style="width: 260px"
        />
      </a-form-item>
    </a-form>
    <template #footer>
      <a-button type="primary" class="mg-l-small" @click="handleSubmit">
        确定
      </a-button>
    </template>
  </a-modal>
</template>

<script setup>
import { defineProps, watch, ref } from "vue";
import { resetPasswordFirst } from "@/api/login";

defineOptions({ name: "resetPassword" });

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:open", "refresh"]);

let formData = {
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
};
const formState = ref({ ...formData });
const formRef = ref(null);

const handleSubmit = async () => {
  await formRef.value.validate();
  const parmas = {
    ...formState.value,
  };
  delete parmas.confirmPassword;
  const res = await resetPasswordFirst(parmas);
  if (res.errno === 0) {
    emit("update:open", false);
    emit("refresh");
  }
};

watch(
  () => props.open,
  (newValue, oldValue) => {
    if (newValue) {
      formState.value = { ...formData };
    }
  },
);
</script>

<style lang="scss" scoped></style>
