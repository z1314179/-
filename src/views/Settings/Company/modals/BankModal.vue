<template>
  <a-modal
    :title="detailsInfo.name ? '编辑账户' : '新增账户'"
    class="bank-modal"
    width="520px"
    okText="保存"
    :mask-closable="false"
    :open="open"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form
      ref="formRef"
      class="form-class"
      :model="formState"
      :rules="formRules"
      :label-col="{ style: { width: '79px' } }"
    >
      <a-form-item label="账户类型" name="accountType">
        <a-radio-group v-model:value="formState.accountType">
          <a-radio
            v-for="(item, index) in bankAccountTypeList.arr"
            :value="item.value"
            :key="index"
          >
            {{ item.label }}
          </a-radio>
        </a-radio-group>
      </a-form-item>
      <a-form-item label="账户名称" name="accountName">
        <a-input
          v-model:value="formState.accountName"
          placeholder="请输入账户名称"
          :maxlength="200"
          allow-clear
        />
      </a-form-item>
      <a-form-item label="开户银行" name="accountOpen">
        <a-input
          v-model:value="formState.accountOpen"
          placeholder="请输入开户银行"
          :maxlength="200"
          allow-clear
        />
      </a-form-item>
      <a-form-item label="开户支行" name="accountOpenBranch">
        <a-input
          v-model:value="formState.accountOpenBranch"
          placeholder="请输入开户行全称，如杭州银行九堡支行"
          :maxlength="200"
          allow-clear
        />
      </a-form-item>
      <a-form-item label="银行账号" name="accountNumber">
        <a-input
          v-model:value="formState.accountNumber"
          placeholder="请输入银行账号"
          :maxlength="200"
          allow-clear
        />
      </a-form-item>
      <a-form-item label="默认账户" name="isDefault">
        <a-radio-group v-model:value="formState.isDefault">
          <a-radio
            v-for="(item, index) in bankAccountDefaultList.arr"
            :value="item.value"
            :key="index"
          >
            {{ item.label }}
          </a-radio>
        </a-radio-group>
      </a-form-item>
      <a-form-item label="备注" name="remark">
        <a-textarea
          v-model:value="formState.remark"
          :auto-size="{ minRows: 2 }"
          placeholder="请输入"
          allow-clear
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup>
import { ref, watch } from "vue";
import { message } from "ant-design-vue";
import hookMap from "@/views/Settings/hookMap.js";

defineOptions({ name: "BankModal" });

const props = defineProps({
  open: Boolean,
  detailsInfo: Object,
});

const { bankAccountTypeList, bankAccountDefaultList } = hookMap();

const emit = defineEmits(["update:open", "change"]);

let formData = {
  accountType: 1,
  accountName: "",
  accountOpen: "",
  accountOpenBranch: "",
  accountNumber: "",
  isDefault: 0,
};
const formState = ref({ ...formData });
const formRef = ref(null);
const formRules = ref({
  accountName: [
    {
      required: true,
      message: "请输入账户名称",
      trigger: "change",
    },
  ],
  accountOpen: [
    {
      required: true,
      message: "请输入开户银行",
      trigger: "change",
    },
  ],
  accountOpenBranch: [
    {
      required: true,
      message: "请输入开户支行",
      trigger: "change",
    },
  ],
  accountNumber: [
    {
      required: true,
      message: "请输入银行账号",
    },
  ],
});

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
  if (props.detailsInfo.accountName) {
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
