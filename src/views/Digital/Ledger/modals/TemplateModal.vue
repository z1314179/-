<template>
  <a-modal
    title="选择模版"
    width="436px"
    okText="下一步"
    :mask-closable="false"
    :open="open"
    @cancel="handleCancel"
    @ok="handleOk"
  >
    <a-form class="form-meta-form" layout="vertical" ref="formRef">
      <a-form-item label="模版">
        <a-select
          v-model:value="templateId"
          :fieldNames="{ label: 'templateName', value: 'id' }"
          :filter-option="filterOption"
          :options="templateOptions"
          allow-clear
          show-search
          placeholder="请选择模版"
          style="width: 328px"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup>
import { ref } from "vue";
import { message } from "ant-design-vue";

defineOptions({ name: "DataTypeModal" });

const props = defineProps({
  open: Boolean,
  templateOptions: Array,
});

const emit = defineEmits(["update:open", "change"]);

const filterOption = (input, option) => {
  return option.templateName.toLowerCase().indexOf(input.toLowerCase()) >= 0;
};

const templateId = ref(undefined);

const handleCancel = () => {
  templateId.value = undefined;
  emit("update:open", false);
};

const handleOk = () => {
  emit("change", templateId.value);
  handleCancel();
};
</script>
