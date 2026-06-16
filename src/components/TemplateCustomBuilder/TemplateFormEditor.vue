<template>
  <template v-if="normalizedComponents.length">
    <template v-for="(comp, idx) in normalizedComponents" :key="comp.props?.fieldName" :xs="24"
      :md="comp.componentType === 'TextareaField' ? 24 : 12">
      <a-form-item :label="comp.props?.label || comp.props?.fieldName || '字段'">
        <a-input v-if="comp.componentType === 'TextField'" v-model:value="innerFormData[comp.props.fieldName]"
          :placeholder="comp.props.placeholder || '请输入'" allow-clear :disabled="disabled" />

        <a-textarea v-else-if="comp.componentType === 'TextareaField'"
          v-model:value="innerFormData[comp.props.fieldName]" :rows="3" :placeholder="comp.props.placeholder || '请输入'"
          allow-clear :disabled="disabled" />

        <a-input-number v-else-if="comp.componentType === 'NumberField'"
          v-model:value="innerFormData[comp.props.fieldName]" :placeholder="comp.props.placeholder || '请输入'"
          :precision="comp.props.precision" :min="comp.props.min" :max="comp.props.max" style="width: 100%"
          :disabled="disabled" />

        <a-select v-else-if="comp.componentType === 'SelectField'" v-model:value="innerFormData[comp.props.fieldName]"
          :options="normalizeOptions(comp.props.options)" :placeholder="comp.props.placeholder || '请选择'" allow-clear
          style="width: 100%" :disabled="disabled" />

        <a-select v-else-if="comp.componentType === 'MultiSelectField'"
          v-model:value="innerFormData[comp.props.fieldName]" mode="multiple"
          :options="normalizeOptions(comp.props.options)" :placeholder="comp.props.placeholder || '请选择'" allow-clear
          style="width: 100%" :disabled="disabled" />

        <a-radio-group v-else-if="comp.componentType === 'RadioField'"
          v-model:value="innerFormData[comp.props.fieldName]" :options="normalizeOptions(comp.props.options)"
          :disabled="disabled" />

        <a-date-picker v-else-if="comp.componentType === 'DateField'"
          v-model:value="innerFormData[comp.props.fieldName]" :format="datePickerDisplayFormat(comp.props.format)"
          value-format="YYYY-MM-DD" style="width: 100%"
          :placeholder="comp.props.placeholder || comp.props.label || '请选择日期'" :disabled="disabled" />

        <a-input v-else v-model:value="innerFormData[comp.props.fieldName]"
          :placeholder="comp.props.placeholder || '请输入'" allow-clear :disabled="disabled" />
      </a-form-item>
    </template>
  </template>

</template>

<script setup>
import { computed, ref, watch } from 'vue'

defineOptions({
  name: 'TemplateFormEditor'
})

const props = defineProps({
  formComponents: {
    type: Array,
    default: () => []
  },
  formData: {
    type: Object,
    default: () => ({})
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:formData'])

const innerFormData = ref({})

const normalizedComponents = computed(() =>
  (props.formComponents || []).filter((item) => item?.props?.fieldName)
)

function defaultValueByType(componentType) {
  if (componentType === 'MultiSelectField') return []
  if (componentType === 'NumberField') return null
  return undefined
}

function syncInnerData() {
  const next = {}
  normalizedComponents.value.forEach((comp) => {
    const field = comp.props.fieldName
    const fromOuter = props.formData?.[field]
    next[field] = fromOuter ?? defaultValueByType(comp.componentType)
  })
  innerFormData.value = next
}

function datePickerDisplayFormat(fmt) {
  if (!fmt || typeof fmt !== 'string') return 'YYYY-MM-DD'
  return fmt.replace(/y/g, 'Y')
}

function normalizeOptions(options) {
  if (!Array.isArray(options)) return []
  return options.map((o) => ({ label: o.label, value: o.value }))
}

watch(
  () => [props.formComponents, props.formData],
  () => {
    syncInnerData()
  },
  { immediate: true, deep: true }
)

watch(
  innerFormData,
  (val) => {
    emit('update:formData', JSON.parse(JSON.stringify(val)))
  },
  { deep: true }
)
</script>

<style lang="scss" scoped>
.template-form-editor {
  margin-top: 16px;
  padding: 12px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;

  .panel-title {
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.85);
  }

  .editor-form {
    margin-top: 8px;
  }
}
</style>
