<template>
  <div class="form-schema-page page-content">
    <a-card :bordered="false">
      <template #title>
        <span>{{ pageSchema.name || '动态表单' }}</span>
      </template>
      <template #extra>
        <a-space>
          <a-button @click="resetToDefault">恢复默认 JSON</a-button>
          <a-button type="primary" :loading="submitting" @click="handleSubmit">提交</a-button>
        </a-space>
      </template>

      <p v-if="pageSchema.description" class="schema-desc">{{ pageSchema.description }}</p>

      <a-collapse v-model:activeKey="activeCollapse" ghost style="margin-bottom: 16px">
        <a-collapse-panel key="json" header="表单配置 JSON（可编辑后点击「应用配置」）">
          <a-textarea v-model:value="schemaJsonText" :auto-size="{ minRows: 14 }" class="json-textarea" />
          <a-space style="margin-top: 8px">
            <a-button type="primary" @click="applySchemaJson">应用配置</a-button>
          </a-space>
        </a-collapse-panel>
      </a-collapse>

      <a-form ref="formRef" layout="vertical" :model="formState" class="dynamic-form">
        <template v-for="(comp, idx) in pageSchema.formComponents" :key="comp.props?.fieldName || idx">
          <a-form-item
            v-if="comp.props?.fieldName"
            :label="comp.props.label"
            :name="comp.props.fieldName"
            :rules="buildRules(comp)"
          >
            <a-input
              v-if="comp.componentType === 'TextField'"
              v-model:value="formState[comp.props.fieldName]"
              :placeholder="comp.props.placeholder"
              allow-clear
            />
            <a-textarea
              v-else-if="comp.componentType === 'TextareaField'"
              v-model:value="formState[comp.props.fieldName]"
              :placeholder="comp.props.placeholder"
              :rows="4"
              allow-clear
            />
            <a-select
              v-else-if="comp.componentType === 'SelectField'"
              v-model:value="formState[comp.props.fieldName]"
              :placeholder="comp.props.placeholder || comp.props.label"
              :options="normalizeOptions(comp.props.options)"
              allow-clear
              style="width: 100%"
            />
            <a-select
              v-else-if="comp.componentType === 'MultiSelectField'"
              v-model:value="formState[comp.props.fieldName]"
              mode="multiple"
              :placeholder="comp.props.placeholder || comp.props.label"
              :options="normalizeOptions(comp.props.options)"
              allow-clear
              style="width: 100%"
            />
            <a-radio-group
              v-else-if="comp.componentType === 'RadioField'"
              v-model:value="formState[comp.props.fieldName]"
              :options="normalizeOptions(comp.props.options)"
            />
            <a-date-picker
              v-else-if="comp.componentType === 'DateField'"
              v-model:value="formState[comp.props.fieldName]"
              :format="datePickerDisplayFormat(comp.props.format)"
              value-format="YYYY-MM-DD"
              style="width: 100%"
              :placeholder="comp.props.label"
            />
            <a-input
              v-else
              v-model:value="formState[comp.props.fieldName]"
              :placeholder="comp.props.placeholder"
              allow-clear
            />
          </a-form-item>
        </template>

        <a-form-item>
          <a-space>
            <a-button type="primary" :loading="submitting" @click="handleSubmit">提交</a-button>
            <a-button @click="clearValues">清空已填</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { defaultFormSchema, initFormValues } from '@/data/defaultFormSchema.js'

defineOptions({
  name: 'DataFormSchema'
})

const formRef = ref(null)
const submitting = ref(false)
const activeCollapse = ref([])

const pageSchema = reactive({
  name: defaultFormSchema.name,
  description: defaultFormSchema.description,
  formComponents: JSON.parse(JSON.stringify(defaultFormSchema.formComponents))
})

const formState = reactive(initFormValues(pageSchema.formComponents))

const schemaJsonText = ref('')

function replaceFormStateFromComponents(list) {
  const next = initFormValues(list)
  Object.keys(formState).forEach((k) => delete formState[k])
  Object.assign(formState, next)
}

function datePickerDisplayFormat(fmt) {
  if (!fmt || typeof fmt !== 'string') return 'YYYY-MM-DD'
  return fmt.replace(/y/g, 'Y')
}

function normalizeOptions(options) {
  if (!Array.isArray(options)) return []
  return options.map((o) => ({ label: o.label, value: o.value }))
}

function buildRules(comp) {
  const p = comp.props || {}
  if (!p.required) return []
  const label = p.label || p.fieldName || '该项'
  return [{ required: true, message: `请填写${label}`, trigger: comp.componentType === 'SelectField' || comp.componentType === 'MultiSelectField' || comp.componentType === 'DateField' ? 'change' : 'blur' }]
}

function syncJsonText() {
  schemaJsonText.value = JSON.stringify(
    {
      name: pageSchema.name,
      description: pageSchema.description,
      formComponents: pageSchema.formComponents
    },
    null,
    2
  )
}

function applySchemaJson() {
  try {
    const parsed = JSON.parse(schemaJsonText.value || '{}')
    if (!parsed.formComponents || !Array.isArray(parsed.formComponents)) {
      message.error('JSON 须包含 formComponents 数组')
      return
    }
    pageSchema.name = typeof parsed.name === 'string' ? parsed.name : pageSchema.name
    pageSchema.description = typeof parsed.description === 'string' ? parsed.description : pageSchema.description
    pageSchema.formComponents = parsed.formComponents
    replaceFormStateFromComponents(pageSchema.formComponents)
    syncJsonText()
    message.success('已应用配置')
  } catch (e) {
    message.error(e instanceof Error ? `JSON 解析失败：${e.message}` : 'JSON 解析失败')
  }
}

function resetToDefault() {
  pageSchema.name = defaultFormSchema.name
  pageSchema.description = defaultFormSchema.description
  pageSchema.formComponents = JSON.parse(JSON.stringify(defaultFormSchema.formComponents))
  replaceFormStateFromComponents(pageSchema.formComponents)
  syncJsonText()
  message.success('已恢复默认表单')
}

function clearValues() {
  replaceFormStateFromComponents(pageSchema.formComponents)
  message.info('已清空')
}

async function handleSubmit() {
  submitting.value = true
  try {
    await formRef.value?.validate()
    const payload = {
      name: pageSchema.name,
      description: pageSchema.description,
      values: { ...formState }
    }
    console.info('[form-schema submit]', payload)
    message.success('校验通过，已在控制台输出提交数据')
  } catch (e) {
    if (e?.errorFields) {
      message.warning('请完善必填项')
    }
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  syncJsonText()
})
</script>

<style lang="scss" scoped>
.form-schema-page {
  :deep(.ant-card) {
    border-radius: 8px;
  }

  .schema-desc {
    margin: 0 0 16px;
    color: rgba(0, 0, 0, 0.55);
    font-size: 14px;
  }

  .json-textarea {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
  }

  .dynamic-form {
    max-width: 640px;
  }
}
</style>
