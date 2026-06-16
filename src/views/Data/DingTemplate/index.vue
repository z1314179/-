<template>
  <div class="ding-template-page page-content">
    <a-card title="钉钉模板渲染测试" :bordered="false">
      <a-alert type="info" show-icon style="margin-bottom: 16px"
        message="基于钉钉 schemaContent.items 动态渲染表单。当前数据来自 mock.json，可在下方 JSON 输入区修改字段值后预览。" />

      <a-divider>渲染结果</a-divider>

      <DingTemplateRenderer :schema-items="schemaItems" v-model:localFormData="localFormData" />

      <a-textarea v-model:value="dataJsonText" :auto-size="{ minRows: 12 }" />

    </a-card>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import DingTemplateRenderer from '@/components/DingTemplateRenderer/index.vue'
import mockSchema from '@/components/DingTemplateRenderer/mock.json'

defineOptions({
  name: 'DataDingTemplate'
})
const localFormData = ref({})
const schemaItems = computed(() => mockSchema?.result?.schemaContent?.items || [])


const dataJsonText = computed(() => {
  return JSON.stringify(localFormData.value, null, 2)
})


</script>

<style scoped lang="scss">
.ding-template-page {
  :deep(.ant-form-item) {
    margin-bottom: 12px;
  }
}
</style>
