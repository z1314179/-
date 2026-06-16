<template>
  <a-modal :open="open" centered title="选择模版" width="420px" @cancel="handleCancel">
    <a-form ref="formRef" class="pd-b-1" layout="vertical" :model="formState" :label-col="{ style: { width: '58px' } }">
      <a-form-item label="模版" name="innerValue" :rules="[{ required: true, message: '请选择模版' }]">
        <a-select show-search v-model:value="formState.innerValue"
          :options="templateOptions" :fieldNames="{ label: 'templateName', value: 'id' }"
          placeholder="请选择模版" style="width: 328px" />
      </a-form-item>
    </a-form>
    <template #footer>
      <a-button @click="handleCancel">取 消</a-button>
      <a-button type="primary" @click="handleNext">下一步</a-button>
    </template>
  </a-modal>
</template>

<script setup>
defineOptions({ name: 'TemplateSelectModal' })
import { computed, ref } from 'vue'
import { message } from 'ant-design-vue'

const formState = ref({

})
const formRef = ref(null)
const props = defineProps({
  open: { type: Boolean, default: false },
  templateOptions: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:open', 'next'])


const handleCancel = () => {
  formState.value = {}
  emit('update:open', false)
}

const handleNext = async () => {
  await formRef.value.validate()
  let obj = props.templateOptions.find(item => item.id == formState.value.innerValue)
  emit('next', obj)
  handleCancel()
}
</script>
