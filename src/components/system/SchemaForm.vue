<template>
  <template v-if="isDetail">
    <span>{{ formatSchemaFieldDetail(comp, formState) || '-' }}</span>
  </template>
  <template v-else>
    <a-input v-if="comp.componentType === 'TextField'" v-model:value="formState[comp.props.fieldName]"
      :placeholder="comp.props.placeholder || '请输入'" allow-clear />
    <a-textarea v-else-if="comp.componentType === 'TextareaField'" v-model:value="formState[comp.props.fieldName]"
      :placeholder="comp.props.placeholder || '请输入'" :rows="comp.props.rows || 2" allow-clear />
    <a-select v-else-if="isSchemaSelectField(comp)" v-model:value="formState[schemaFormBindingKey(comp)]"
      :placeholder="comp.props.placeholder || comp.props.label || '请选择'"
      :options="normalizeSchemaOptions(comp.props.options)" allow-clear />
    <a-select v-else-if="comp.componentType === 'MultiSelectField'" v-model:value="formState[comp.props.fieldName]"
      mode="multiple" :placeholder="comp.props.placeholder || comp.props.label || '请选择'"
      :options="normalizeSchemaOptions(comp.props.options)" allow-clear />
    <a-radio-group v-else-if="comp.componentType === 'RadioField'" v-model:value="formState[comp.props.fieldName]"
      :options="normalizeSchemaOptions(comp.props.options)" />
    <a-date-picker v-else-if="comp.componentType === 'DateField'" v-model:value="formState[comp.props.fieldName]"
      :format="schemaDatePickerDisplayFormat(comp.props.format)" value-format="YYYY-MM-DD" style="width: 100%"
      :placeholder="comp.props.label || '请选择日期'" />
    <a-range-picker v-else-if="comp.componentType === 'RangeDateField'" v-model:value="formState[comp.props.fieldName]"
      :format="schemaDatePickerDisplayFormat(comp.props.format)" value-format="YYYY-MM-DD" style="width: 100%" />
    <a-input v-else v-model:value="formState[comp.props.fieldName]" :placeholder="comp.props.placeholder || '请输入'"
      allow-clear />
  </template>
</template>

<script setup>
import {
  normalizeSchemaOptions,
  schemaDatePickerDisplayFormat,
  formatSchemaFieldDetail,
  schemaFormBindingKey,
} from './schemaFormField.js'

function isSchemaSelectField(comp) {
  const t = comp?.componentType || comp?.componentName
  return t === 'SelectField' || t === 'DDSelectField'
}

defineOptions({
  name: 'SchemaForm',
})

const props = defineProps({
  isDetail: {
    type: Boolean,
    default: false,
  },
  /** 单条 schema 配置（原 formComponents 中的一项） */
  comp: {
    type: Object,
    required: true,
  },
  formState: {
    type: Object,
    default: () => ({}),
  },
  inputStyle: {
    type: Object,
    default: () => ({ width: '100%' }),
  },
})

const formState = props.formState

function resolveInputStyle(comp) {
  return {
    ...props.inputStyle,
    ...(comp?.props?.inputStyle || {}),
  }
}
</script>

<style lang="scss" scoped></style>
