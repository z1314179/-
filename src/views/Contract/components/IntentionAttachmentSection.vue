<template>
  <a-table
    :columns="columns"
    :data-source="rows"
    :pagination="false"
    row-key="id"
    :scroll="{ x: 760 }"
    size="small"
  >
    <template #bodyCell="{ column, record, index }">
      <template v-if="column.key === 'index'">
        {{ index + 1 }}
      </template>
      <template v-else-if="column.key === 'name'">
        <span class="file-name">{{ record.name }}</span>
      </template>
      <template v-else-if="column.key === 'action'">
        <a-space :size="10">
          <a-button type="link" size="small" @click="handlePreview(record)">预览</a-button>
          <a-button type="link" size="small" @click="handleDownload(record)">下载</a-button>
        </a-space>
      </template>
    </template>
  </a-table>
</template>

<script setup>
import { message } from 'ant-design-vue'

defineOptions({ name: 'IntentionAttachmentSection' })

const props = defineProps({
  formState: {
    type: Object,
    required: true
  }
})

const columns = [
  { title: '序号', key: 'index', width: 70 },
  { title: '文件', key: 'name' },
  { title: '上传人', dataIndex: 'uploader', key: 'uploader', width: 120 },
  { title: '上传时间', dataIndex: 'uploadTime', key: 'uploadTime', width: 180 },
  { title: '操作', key: 'action', width: 140 }
]

if (!Array.isArray(props.formState.attachments)) {
  props.formState.attachments = []
}
const rows = props.formState.attachments

function handlePreview(record) {
  if (!record?.url) {
    message.warning('暂无可预览文件')
    return
  }
  window.open(record.url, '_blank')
}

function handleDownload(record) {
  if (!record?.url) {
    message.warning('暂无可下载文件')
    return
  }
  window.open(record.url, '_blank')
}
</script>

<style scoped lang="scss">
.file-name {
  color: rgba(0, 0, 0, 0.85);
}
</style>
