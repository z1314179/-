<template>
  <a-modal
    :title="type == 'refuse' ? '拒绝' : '通过'"
    width="420px"
    okText="确定"
    :mask-closable="false"
    :open="open"
    @cancel="handleCancel"
    @ok="handleOk"
    class="approve-modal"
  >
    <a-form
      class="form-meta-form"
      layout="vertical"
      ref="formRef"
      :model="formState"
    >
      <div class="title mg-b-small flex align-center">
        <ExclamationCircleFilled class="icon-mg" />
        <span>
          {{
            type == "refuse"
              ? "请确认是否要审批拒绝？"
              : "请确认是否要审批通过？"
          }}
        </span>
      </div>
      <div class="pd-x-36">
        <a-form-item
          :label="type == 'refuse' ? '不通过理由' : '通过理由'"
          name="reason"
          :rules="[
            {
              required: type === 'refuse',
              message: '请输入不通过理由',
              trigger: 'change',
            },
          ]"
        >
          <a-textarea
            v-model:value="formState.reason"
            placeholder="请输入"
            :auto-size="{ minRows: 3, maxRows: 5 }"
          />
        </a-form-item>
      </div>
    </a-form>
  </a-modal>
</template>

<script setup>
import { ref, watch } from "vue";
import { message } from "ant-design-vue";
import { ExclamationCircleFilled } from "@ant-design/icons-vue";
import { approveBorrowing } from "@/api/Contract/borrowing.js";

defineOptions({ name: "DataTypeModal" });

const props = defineProps({
  open: Boolean,
  type: String, // 拒绝 refuse, 同意 agree
  id: [String, Number],
});

const emit = defineEmits(["update:open", "change"]);

const formRef = ref(null);
const formState = ref({
  id: "",
  reason: "",
  result: "",
});
const handleCancel = () => {
  formState.value.reason = "";
  formRef.value.resetFields();
  emit("update:open", false);
};

const handleOk = async () => {
  await formRef.value.validate();
  const res = await approveBorrowing(formState.value);
  if (res.errno == 0) {
    message.success("审批成功");
    emit("change");
    handleCancel();
  }
};
watch(
  () => props.open,
  (newValue, oldValue) => {
    if (newValue) {
      formState.value.id = props.id;
      formState.value.result = props.type;
    }
  },
);
</script>
<style lang="scss" scoped>
.approve-modal {
  .title {
    font-weight: 500;
    font-size: 16px;
    color: rgba(0, 0, 0, 0.88);
    .icon-mg {
      margin: 0 13px 0 2px;
      color: #faad14;
      font-size: 21px;
    }
  }
  .pd-x-36 {
    padding: 0 36px;
  }
}
</style>
