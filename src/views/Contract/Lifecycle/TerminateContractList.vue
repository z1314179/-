<template>
  <div class="contract-list-container">
    <SearchCard :is-exp="true">
      <a-form layout="inline" autocomplete="off" :label-col="{ style: { width: '85px' } }">
        <a-form-item label="对方客商">
          <a-input v-model:value="formState.counterpartyName" :maxlength="200" allow-clear placeholder="请输入" />
        </a-form-item>
        <a-form-item label="我方主体">
          <a-select class="select-placeholder" allow-clear v-model:value="formState.ourCompanyId"
            :options="subjectOptionsWithAll.arr" :field-names="{ label: 'companyName', value: 'id' }" placeholder="全部" />
        </a-form-item>
        <a-form-item label="终止日期">
          <a-range-picker v-model:value="formState.finalDateRange" value-format="YYYY-MM-DD"
            :placeholder="['开始日期', '结束日期']" />
        </a-form-item>
        <a-form-item label="经办人">
          <a-input v-model:value="formState.handlerUserName" :maxlength="50" allow-clear placeholder="请输入" />
        </a-form-item>
        <a-form-item label="经办部门">
          <cascaderCheck class="select-placeholder" v-model:value="formState.handlerDeptId" :options="deptList"
            :field-names="{ label: 'name', value: 'id', children: 'children' }" show-search tree-node-filter-prop="name"
            tree-default-expand-all tree-data-simple-mode placeholder="全部" allow-clear />
        </a-form-item>
      </a-form>
      <template #right>
        <a-button class="mg-l-1" @click="reset">重 置</a-button>
        <a-button class="mg-l-1" type="primary" @click="search">查 询</a-button>
      </template>
    </SearchCard>

    <a-card class="card_table mg-t-small">
      <div class="mg-y-medium">
        <a-tabs v-model:activeKey="clauseActiveKey" @change="handleClauseTabChange">
          <a-tab-pane key="all" :tab="totalStr" />
          <a-tab-pane key="pending" :tab="waitStr" />
        </a-tabs>
      </div>
      <a-table row-key="id" :columns="columns" :data-source="dataSource" :loading="loadTable" :pagination="searchQuery"
        :scroll="{ x: 1400 }" @change="handleTableChange">
        <template #bodyCell="{ column, text, record, index }">
          <template v-if="column.dataIndex === 'index'">
            {{ (searchQuery.current - 1) * searchQuery.pageSize + index + 1 }}
          </template>
          <template v-else-if="column.dataIndex === 'ourCompanyRelations'">
            <a-tooltip :title="formatOurCompanies(record)">
              <span class="cell-text-ellipsis">{{ formatOurCompanies(record) || '-' }}</span>
            </a-tooltip>
          </template>
          <template v-else-if="column.dataIndex === 'counterpartyRelations'">
            <a-tooltip :title="formatCounterparties(record)">
              <span class="cell-text-ellipsis">{{ formatCounterparties(record) || '-' }}</span>
            </a-tooltip>
          </template>
          <template v-else-if="column.dataIndex === 'contractNo'">
            <a-tooltip :title="record.contract.contractNo">
              <a-button type="link" class="cell-text-ellipsis"
                @click="toRouterQuery('/contract/lifecycle/detail', { id: record.contract.id })">
                {{ record.contract.contractNo || '-' }}
              </a-button>

            </a-tooltip>
          </template>
          <template v-else-if="column.dataIndex === 'startDate'">
            {{ record.contract.startDate || '-' }}
          </template>
          <template v-else-if="column.dataIndex === 'amountTaxIncluded'">
            {{ nFormat(record.contract.amountTaxIncluded, 2) }}
          </template>
          <template v-else-if="['createUserName', 'dept'].includes(column.dataIndex)">
            <a-tooltip :title="text">
              <span class="cell-text-ellipsis">{{ text || '-' }}</span>
            </a-tooltip>
          </template>
          <template v-else-if="column.dataIndex === 'action'">
            <a-button class="mg-r-1" v-if="!isPendingRow(record)" type="link"
              @click="handleOpenDetail(record)">查看</a-button>
            <template v-else>
              <a-button type="link" class="mg-r-small" v-if="PERM('生命周期编辑')" @click="handleSubmit(record)">提交</a-button>
              <a-button type="link" class="mg-r-small" v-if="PERM('生命周期编辑')" @click="handleEdit(record)">编辑</a-button>
              <a-popconfirm v-if="PERM('生命周期删除')" class="mg-r-small" title="你确定要删除吗？" placement="top" ok-text="确定"
                cancel-text="取消" @confirm="handleDelete(record)">
                <a-button type="link">删除</a-button>
              </a-popconfirm>
            </template>

          </template>
          <template v-else-if="column.dataIndex === 'finalStatus'">
            <span class="tag_base" :class="statusOptions[text]?.class || ''">
              {{ statusOptions[text]?.label || '-' }}
            </span>
          </template>
        </template>
      </a-table>
    </a-card>
    <TerminationDetailModal @refresh="getList" v-model:open="terminationDetailOpen" :detail="terminationDetail"
      :find-current-user-running-task="findCurrentUserRunningTask" />
    <TerminateContractModal v-model:open="terminateModalOpen" mode="edit" :detail="terminateRecord"
      @refresh="handleTerminateSuccess" />
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
const PERM = inject('PERM')
import { message } from 'ant-design-vue'
import SearchCard from '@/components/system/SearchCard.vue'
import cascaderCheck from '@/components/system/cascaderCheck.vue'
import useTable from '@/hook/useTable.js'
import {
  getContractFinalList,
  contractFinalDelete,
  contractFinalSubmit,
} from '@/api/Contract/lifecycle'
import TerminationDetailModal from './modals/TerminationDetailModal.vue'
import TerminateContractModal from './modals/TerminateContractModal.vue'

defineOptions({ name: 'ContractLifecycleTerminateList' })

defineProps({
  subjectOptionsWithAll: { type: Object, default: () => {} },
  deptList: { type: Array, default: () => [] },
  findCurrentUserRunningTask: { type: Function, default: null },
})

const clauseActiveKey = ref('all')
const terminationDetailOpen = ref(false)
const terminationDetail = ref(null)
const terminateModalOpen = ref(false)
const terminateRecord = ref(null)
const loadbtn = ref(false)
const pendingSubmitCount = ref(0)
const statusOptions = {
  0: { label: '草稿', class: 'tag_cg' },
  1: { label: '审批中', class: 'tag_spz' },
  2: { label: '已通过', class: 'tag_wks' },
  3: { label: '已拒绝', class: 'tag_yjj' },
}
const columns = [
  { title: '序号', dataIndex: 'index', key: 'index', width: 60 },
  { title: '我方主体', dataIndex: 'ourCompanyRelations', key: 'ourCompanyRelations', width: 220, },
  { title: '对方客商', dataIndex: 'counterpartyRelations', key: 'counterpartyRelations', width: 200, },
  {
    title: '合同号',
    dataIndex: 'contractNo', key: 'contractNo', width: 160,
  },
  { title: '合同开始日期', dataIndex: 'startDate', key: 'startDate', width: 130, sorter: true },
  { title: '合同终止日期', dataIndex: 'finalDate', key: 'finalDate', width: 130, sorter: true },
  { title: '合同金额(元)', dataIndex: 'amountTaxIncluded', key: 'amountTaxIncluded', width: 120 },
  { title: '经办人', dataIndex: 'createUserName', key: 'createUserName', width: 100, },
  {
    title: '经办部门',
    customRender: ({ record }) => record.contract?.handlerDeptName || '-',
    dataIndex: 'handlerDeptName', key: 'handlerDeptName', width: 120,
  },
  { title: '状态', dataIndex: 'finalStatus', key: 'finalStatus', width: 100, fixed: 'right' },
  { title: '操作', dataIndex: 'action', key: 'action', width: 160, fixed: 'right' },
]
const totalStr = ref('全部合同')
const waitStr = ref('待提交')
function formatOurCompanies(record) {
  return record.contract.ourCompanyRelations.map(item => item.companyName).join('、')
}

function formatCounterparties(record) {
  return record.contract.counterpartyRelations.map(item => item.counterpartyName).join('、')
}

function isPendingRow(record) {
  return record?.finalStatus === 0
}

function handleOpenDetail(record) {
  terminationDetail.value = record
  terminationDetailOpen.value = true
}

function handleEdit(record) {
  terminateRecord.value = record
  terminateModalOpen.value = true
}

function handleTerminateSuccess() {
  getList()

}

async function handleSubmit(record) {
  const id = record?.id
  if (!id) {
    message.warning('缺少终止记录 ID')
    return
  }
  if (loadbtn.value) return
  loadbtn.value = true
  try {
    const res = await contractFinalSubmit({ id })
    if (res.errno === 0) {
      message.success('提交成功')
      getList()
    }
  } finally {
    loadbtn.value = false
  }
}

async function handleDelete(record) {
  const id = record?.id
  if (!id) {
    message.warning('缺少终止记录 ID')
    return
  }
  if (loadbtn.value) return
  loadbtn.value = true
  try {
    const res = await contractFinalDelete({ id })
    if (res.errno === 0) {
      message.success('删除成功')
      getList('del')
    }
  } finally {
    loadbtn.value = false
  }
}

const getApi = async (query) => {
  if (clauseActiveKey.value === 'all') {
  } else {
    query.tabStatus = 0
  }
  const { data } = await getContractFinalList(query)
  totalStr.value = `全部合同(${data.tabTotal || 0})`
  waitStr.value = `待提交(${data.pendingSubmitCount || 0})`
  return { data: data.data, total: data.total }
}

const getSearchQuery = (query) => {
  if (query.finalDateRange) {
    query.finalDateStart = query.finalDateRange[0]
    query.finalDateEnd = query.finalDateRange[1]
  }

  return query
}

function handleClauseTabChange() {
  getList()
}

const {
  dataSource,
  loadTable,
  searchQuery,
  handleTableChange,
  getList,
  search,
  reset,
  formState,
  nFormat,
  toRouterQuery
} = useTable(getApi, {}, { getSearchQuery })

const getloadTable = () => {
  getList()
}

defineExpose({
  getloadTable,
})
</script>

<style scoped lang="less">
.contract-list-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.ant-tabs) {
  .ant-tabs-tab-btn {
    color: var(--text-color) !important;
  }

  .ant-tabs-tab-active .ant-tabs-tab-btn {
    font-weight: 500;
    color: var(--text-color);
  }
}
</style>
