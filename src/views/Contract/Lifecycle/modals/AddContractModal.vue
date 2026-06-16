<template>
  <a-modal :open="open" title="选择模板" :mask-closable="false" width="420px" @cancel="handleCancel">
    <a-form ref="formRef" layout="vertical" :model="formState" class="pd-b-medium">
      <a-form-item label="模版" name="template" :rules="[{ required: true, message: '请选择合同模版' }]">
        <a-select v-model:value="innerValue" :options="templateOptions" placeholder="请选择模板" style="width: 260px" />
      </a-form-item>

    </a-form>
    <template #footer>
      <a-button @click="handleCancel">取消</a-button>
      <a-button type="primary" @click="handleNext">下一步</a-button></template>
  </a-modal>
</template>

<script setup>
import { computed, ref } from 'vue'
import { message } from 'ant-design-vue'

defineOptions({ name: 'LifecycleAddContractModal' })
const formRef = ref(null)
const props = defineProps({
  open: { type: Boolean, default: false },
  modelValue: { type: String, default: '' },
  templateOptions: { type: Array, default: () => [] },
})
const formState = ref({})
const emit = defineEmits(['update:open', 'update:modelValue', 'next'])

const innerValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const handleCancel = () => emit('update:open', false)

const handleNext = async () => {
  await await formRef.value?.validate()
  if (!innerValue.value) {
    message.warning('请先选择合同模版')
    return
  }
  emit('next', innerValue.value)
}
</script>
