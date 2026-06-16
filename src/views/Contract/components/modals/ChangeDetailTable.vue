<template>
  <a-table row-key="id" :columns="columns" :data-source="tableList" :loading="loadTable" :pagination="searchQuery"
    :scroll="{ x: 920 }" @change="handleTableChange">
    <template #bodyCell="{ column, text, record, index }">
      <template v-if="column.dataIndex === 'index'">
        {{ (searchQuery.current - 1) * searchQuery.pageSize + index + 1 }}
      </template>
      <template v-else-if="column.dataIndex === 'oldData'">
        <div v-if="record.type === 'TABLE' && Array.isArray(record.oldData)">
          <div v-for="item in record.oldData" :key="item">
            {{ item }}
          </div>
        </div>
        <div v-else-if="record.type === 'FILE'">
          <FileRowItem v-for="item in record.oldData" :key="item" :item="item">
            <template #right>
              <a-button type="link" @click="handleFileDownload(item)">下载</a-button>
            </template>
          </FileRowItem>
        </div>
        <div v-else> {{ text || '-' }} </div>
      </template>
      <template v-else-if="column.dataIndex === 'newData'">
        <div v-if="record.type === 'TABLE' && Array.isArray(record.newData)">
          <div v-for="item in record.newData" :key="item">
            {{ item }}
          </div>
        </div>
        <div v-else-if="record.type === 'FILE'">
          <FileRowItem v-for="item in record.newData" :key="item" :item="item">

            <template #right>

              <a-button type="link" @click="handleFileDownload(item)">下载</a-button>
            </template>
          </FileRowItem>
        </div>
        <div v-else> {{ text || '-' }} </div>
      </template>
      <template v-else> {{ text || '-' }} </template>
    </template>
  </a-table>
</template>

<script setup>
import { ref, watch } from 'vue'
import useTable from '@/hook/useTable.js'
import { getLog } from '@/api/record.js'
import FileRowItem from '@/components/upload/FileRowItem.vue'
import { downloadFile } from '@/utils/preview.js'

function handleFileDownload(item) {
  downloadFile(item)
}

defineOptions({ name: 'ChangeDetailTable' })

const props = defineProps({
  /** 历史版本详情；变更行列表放在 changeDetails / changeList */
  displayChangeDetails: { type: Object, default: null },
  rowData: { type: Object, default: () => { } },
})

const columns = [
  { title: '序号', dataIndex: 'index', key: 'index', width: 40 },
  { title: '变更字段', dataIndex: 'title', key: 'title', width: 100, },
  { title: '变更前', dataIndex: 'oldData', key: 'oldData', width: 200, },
  { title: '变更后', dataIndex: 'newData', key: 'newData', width: 200, },
]
const tableRows = ref([])
const getApi = async (query) => {
  const { data } = await getLog({
    objectId: props.rowData.id,
  })
  let obj = {}
  try {
    obj = JSON.parse(data[0].content)
  } catch (error) {
    obj = []
  }

  let list = []
  for (const key in obj) {
    const oldNorm = normalizeChangeField(key, obj[key]?.[0])
    const newNorm = normalizeChangeField(key, obj[key]?.[1])
    list.push({
      type: oldNorm.type !== 'text' ? oldNorm.type : newNorm.type,
      title: key,
      oldData: oldNorm.value,
      newData: newNorm.value,
    })
  }
  return { data: list, total: list.length }
}

function normalizeChangeField(key, data) {
  if (data == null || data === '') {
    return { type: 'text', value: data }
  }
  if (!Array.isArray(data)) {
    return { type: 'text', value: data }
  }
  if (!data.length) {
    return { type: 'text', value: data }
  }

  if (key === '合同起止日期') {
    return { type: 'text', value: data.join(' 至 ') }
  }
  if (key === '设置参与方') {
    return {
      type: 'TABLE',
      value: data.map((item) => {
        if (item.role === 'our') {
          return '我方：' + item.companyName
        }
        if (item.role === 'partner') {
          return [
            '对方：' + item.counterpartyName,
            item.bankInfo?.accountOpen,
            item.bankInfo?.accountOpenBranch,
            item.bankInfo?.accountNumber,
          ].filter(Boolean).join(' ')
        }
        return ''
      }).filter(Boolean),
    }
  }
  if (key === '关联合同') {
    return {
      type: 'TABLE',
      value: data.map((item) => '合同名称：' + item.contractName).filter(Boolean),
    }
  }
  if (key === '收付计划') {
    return {
      type: 'TABLE',
      value: data.map((item) => [
        '收付节点：' + item.payReceiveNode,
        '预计日期：' + item.expectedDate,
        '比例：' + item.ratio,
        '金额：' + item.amount,
        '我方主体：' + (item.companyName ?? item.companyId),
        '对方客商：' + (item.counterpartyName ?? item.counterpartyId),
        '备注：' + (item.remark || '-'),
      ].join(' ')),
    }
  }
  if (key === '预算分摊') {
    return {
      type: 'TABLE',
      value: data.map((item) => [
        '费用类型：' + (item.expenseTypeName ?? item.expenseTypeCode),
        '预算日期：' + item.budgetDate,
        '比例：' + item.ratio,
        '金额：' + item.amount,
        '所属部门：' + (item.deptName ?? item.deptId),
        '备注：' + (item.remark || '-'),
      ].join(' ')),
    }
  }
  if (key === '其他附件' || key === '合同文本') {
    return {
      type: 'FILE',
      value: data.map((item) => item.fileUrl ?? item),
    }
  }
  if (data.some((item) => Array.isArray(item))) {
    return {
      type: 'TABLE',
      value: data.map((row) => (Array.isArray(row) ? row.join('；') : row)),
    }
  }
  return { type: 'text', value: data.join('、') }
}
const { dataSource: tableList, searchQuery, handleTableChange, search, loadTable } = useTable(getApi, {
  current: 1,
  pageSize: 8,
  pageSizeOptions: ['8', '10', '20', '50'],
})

watch(
  () => props.displayChangeDetails,
  (detail) => {
    search()
  },
  { deep: true, immediate: true },
)
</script>

<style scoped lang="scss"></style>
