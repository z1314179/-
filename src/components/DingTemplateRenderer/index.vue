<template>

  <template v-for="(item, index) in normalizedItems" :key="item.id">
    <a-divider v-if="item.componentName === 'ColumnLayout'" orientation="left" class="section-divider">
      -----
    </a-divider>
    <template v-else>
      <DingTemplateFieldControl :class="`form-item-${index}`" v-if="isHidden(item.id)" :item="item"
        :field-form-name="fieldFormName" :is-detail="isDetail" :form-data="localFormData"
        @upload-done="validateField" />
    </template>
  </template>

</template>

<script setup>
import { watch, ref, nextTick, provide, toRef } from 'vue'
import DingTemplateFieldControl from './DingTemplateFieldControl.vue'
import { parseDingSelectOptions } from './dingFieldItemNormalize.js'

const props = defineProps({
  schemaItems: {
    type: Array,
    default: () => []
  },
  localFormData: {
    type: Object,
    default: () => ({})
  },
  isDetail: {
    type: Boolean,
    default: false,
  },
  fieldFormName: {
    type: Array,
    default: () => [],
  },
  subjectOptionList: {
    type: Array,
    default: () => [],
  },
})

provide('subjectOptionList', toRef(props, 'subjectOptionList'))
const behaviorLinkageOBJ = ref({})
const formRef = ref()
const isHidden = (id) => {
  if (!behaviorLinkageOBJ.value[id]) return true
  let arr = behaviorLinkageOBJ.value[id] || []
  let state = arr.every(item => {
    if (Array.isArray(props.localFormData[item.id])) {
      return props.localFormData[item.id].includes(item.value)
    } else {
      return props.localFormData[item.id] === item.value
    }
  })
  if (!state) {
    props.localFormData[id] = undefined
  }
  return state
}

const normalizeFieldItem = (item) => {
  const sourceProps = item?.props || {}
  const id = sourceProps.id || item?.id || ''
  return {
    id,
    type: item?.type,
    componentName: item?.componentName || '',
    label: sourceProps.label || '未命名字段',
    placeholder: sourceProps.placeholder,
    required: Boolean(sourceProps.required),
    format: sourceProps.format,
    options: parseDingSelectOptions(sourceProps.options),
    behaviorLinkage: sourceProps.behaviorLinkage || [],
    actionName: sourceProps.actionName || '添加',
    children: Array.isArray(item?.children) ? item.children.map((child) => normalizeFieldItem(child)) : []
  }
}

const normalizedItems = ref([])

const validateField = async (fieldId) => {
  await nextTick()
  try {
    await formRef.value?.validateFields?.([fieldId])
  } catch (error) {
    // 校验失败由 FormItem 自行展示错误提示
  }
}

watch(() => props.schemaItems, (newVal) => {
  behaviorLinkageOBJ.value = {}
  normalizedItems.value = props.schemaItems.map((item) => {
    const sourceProps = item?.props || {}
    if (sourceProps.behaviorLinkage?.length) {
      sourceProps.behaviorLinkage.forEach((linkage) => {
        linkage.targets.forEach((target) => {
          let keys = { id: sourceProps.id, value: linkage.value, label: sourceProps.label }
          if (behaviorLinkageOBJ.value[target.fieldId]) {
            behaviorLinkageOBJ.value[target.fieldId].push(keys)
          } else {
            behaviorLinkageOBJ.value[target.fieldId] = [keys]
          }

        })
      })
    }
    return normalizeFieldItem(item)
  })


}, { deep: true, immediate: true })
</script>

<style scoped lang="scss">
.ant-form {
  display: flex;
  flex-wrap: wrap;
}

:deep(.ant-form-item) {
  // width: 30%;
  margin: 10px;
}
</style>
