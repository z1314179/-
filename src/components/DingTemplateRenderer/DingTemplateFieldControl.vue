<template>
  <a-form-item :class="{ 'ding-field-form-item--full-row': item.componentName === 'TableField' }" :name="fieldFormNames"
    :rules="fieldRules">
    <template #label>
      <span>{{ fieldLabelText }}</span>
      <!-- <a-tag v-if="behaviorLinkageTagVisible" color="processing" class="linkage-tag">
        联动
      </a-tag> -->
    </template>

    <div class="ding-template-field-control">
      <TableFieldControl :isDetail="isDetail" v-if="item.componentName === 'TableField'" :item="item"
        :field-form-name="fieldFormName" :form-data="formData" @upload-done="(id) => emit('upload-done', id)" />
      <DingFieldControlCore :isDetail="isDetail" v-else :item="item" :form-data="formData" :field-key="fieldFormKey"
        @upload-done="(id) => emit('upload-done', id)" />
    </div>
  </a-form-item>
</template>



<script setup>

import TableFieldControl from './TableFieldControl.vue'

import DingFieldControlCore from './DingFieldControlCore.vue'

import { computed } from 'vue'
const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  formData: {
    type: Object,
    required: true,
  },
  fieldFormName: {
    type: Array,
    default: () => [],
  },
  isDetail: {
    type: Boolean,
    default: false,
  },
})



const emit = defineEmits(['upload-done'])



/** 表单 model 上的字段 key：原始 schema 在 item.props.id，扁平化后为 item.id */

const resolveFieldId = () => props.item.props?.id ?? props.item.id ?? ''

const fieldFormNames = computed(() => {
  return [...props.fieldFormName, resolveFieldId()]
})
const fieldFormKey = computed(() => resolveFieldId())



const fieldLabelText = computed(

  () => props.item?.label ?? '未命名字段'

)



const fieldRequired = computed(() =>
  Boolean(props.item.required)
)


const DING_INPUT_COMPONENTS = new Set([
  'TextField',
  'TextareaField',
  'NumberField',
  'MoneyField',
  'PhoneField',
  'IdCardField',
])

const fieldRequiredMessage = computed(() => {
  const prefix = DING_INPUT_COMPONENTS.has(props.item.componentName) ? '请输入' : '请选择'
  return `${prefix}${fieldLabelText.value}`
})

const fieldRules = computed(() => {
  if (props.isDetail || !fieldRequired.value) return []
  const key = fieldFormKey.value
  const message = fieldRequiredMessage.value
  const componentName = props.item.componentName
  return [
    {
      required: props.item.required,
      validator: async () => {
        const value = props.formData[key]
        if (isDingFieldValueEmpty(value, componentName)) {
          return Promise.reject(message)
        }
        return Promise.resolve()
      },
      trigger: ['change'],
    },
  ]
})

function isDingFieldValueEmpty(value, componentName) {
  if (value === undefined || value === null || value === '') return true
  if (componentName === 'NumberField' || componentName === 'MoneyField') return false
  if (!Array.isArray(value)) return false
  if (componentName === 'DDDateRangeField') {
    return value.length < 2 || value.some((v) => v === undefined || v === null || v === '')
  }
  return value.length === 0
}

</script>



<style scoped lang="scss">
.ding-template-field-control {
  width: 100%;
}

/** 表格字段独占一行（外层多为 flex-wrap） */
.ding-field-form-item--full-row {
  width: 100% !important;

  &.ant-form-item {
    :deep(.ant-form-item-row) {
      width: 100% !important;
    }
  }
}
</style>
