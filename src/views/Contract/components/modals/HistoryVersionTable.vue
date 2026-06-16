<template>
  <a-table row-key="id" :columns="columns" :data-source="tableList" :loading="loadTable" :pagination="searchQuery"
    :scroll="{ x: 1040 }" @change="handleTableChange">
    <template #bodyCell="{ column, text, record, index }">
      <template v-if="column.dataIndex === 'index'">
        {{ (searchQuery.current - 1) * searchQuery.pageSize + index + 1 }}
      </template>
      <template v-else-if="column.dataIndex === 'lastApproveUserName'">
        <div class="audit-opinion-cell">{{ text || '-' }}</div>
      </template>
      <template v-else-if="column.dataIndex === 'lastApproveRemark'">
        <div class="audit-opinion-cell">{{ text || '-' }}</div>
      </template>
      <template v-else-if="column.dataIndex === 'action'">
        <a-button type="link" class="pd-0" @click="emit('changeActiveTab', 'change', record)">
          查看明细
        </a-button>
      </template>
      <template v-else-if="['version', 'submitter', 'submitTime', 'passed', 'auditor'].includes(column.dataIndex)">
        {{ text || '-' }}
      </template>
    </template>
  </a-table>
</template>

<script setup>
import { watch } from 'vue'
import useTable from '@/hook/useTable.js'
import { getIntentionContractHistory } from '@/api/Contract/intention'
defineOptions({ name: 'HistoryVersionTable' })

const props = defineProps({
  rowData: { type: Object, default: () => { } },
})

const emit = defineEmits(['changeActiveTab'])

const columns = [
  { title: '序号', dataIndex: 'index', key: 'index', width: 50, fixed: 'left' },
  { title: '版本号', dataIndex: 'versionCode', key: 'versionCode', width: 88 },
  { title: '提交人', dataIndex: 'handlerUserName', key: 'handlerUserName', width: 100 },
  { title: '提交时间', dataIndex: 'createTime', key: 'createTime', width: 168 },
  { title: '审核人', dataIndex: 'lastApproveUserName', key: 'lastApproveUserName', width: 100 },
  { title: '审核意见', dataIndex: 'lastApproveRemark', key: 'lastApproveRemark', width: 220, ellipsis: true },
  { title: '操作', dataIndex: 'action', key: 'action', width: 96, fixed: 'right' },
]

const getApi = async (query) => {
  const { data } = await getIntentionContractHistory({ id: props.rowData.id })
  return { data: data, total: data.length }
}

const { dataSource: tableList, searchQuery, handleTableChange, getList , loadTable } = useTable(getApi, {
  current: 1,
  pageSize: 8,
  pageSizeOptions: ['8', '10', '20', '50'],
})
getList()
</script>

<style scoped lang="scss">
.audit-opinion-cell {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
