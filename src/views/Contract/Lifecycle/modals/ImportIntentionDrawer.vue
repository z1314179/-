<template>
  <a-drawer class="import-intention-drawer" :open="open" title="引入意向合同" placement="right" width="1140px"
    destroy-on-close @close="onClose">
    <SearchCard :is-exp="false" style="padding: 0">
      <a-form layout="inline" autocomplete="off" :label-col="{ style: { width: '96px' } }">
        <a-form-item label="合同名称" :label-col="{ style: { width: '70px' } }">
          <a-input v-model:value="formState.key" :maxlength="200" allow-clear placeholder="请输入" />
        </a-form-item>
        <a-form-item label="对方客商">
          <a-input v-model:value="formState.counterpartyName" :maxlength="200" allow-clear placeholder="请输入" />
        </a-form-item>
        <a-form-item label="合同分类" :label-col="{ style: { width: '70px' } }">
          <a-select class="select-placeholder" allow-clear v-model:value="formState.contractCategory"
            :options="categoryOptionsWithAll.arr" placeholder="全部" />
        </a-form-item>
        <!-- <a-form-item label="合同状态">
          <a-select
            class="select-placeholder"
            allow-clear
            v-model:value="formState.status"
            :options="contractStatusList.arr"
            placeholder="全部"
          />
        </a-form-item> -->
        <a-form-item label="签约日期" :label-col="{ style: { width: '70px' } }">
          <a-range-picker v-model:value="formState.signDateRange" value-format="YYYY-MM-DD"
            :placeholder="['开始日期', '结束日期']" allow-clear />
        </a-form-item>
        <a-form-item label="合同开始日期">
          <a-range-picker v-model:value="formState.dateRange" value-format="YYYY-MM-DD" :placeholder="['开始日期', '结束日期']"
            allow-clear />
        </a-form-item>
        <a-form-item label="我方主体"  :label-col="{ style: { width: '70px' } }">
          <a-select class="select-placeholder" allow-clear v-model:value="formState.ourCompanyId"
            :options="subjectOptionsWithAll.all" :fieldNames="{
              label: 'companyName',
              value: 'id',
            }" placeholder="全部" />
        </a-form-item>
        <a-form-item label="合同金额" :label-col="{ style: { width: '70px' } }">
          <groupNum v-model:start="formState.amountMin" v-model:end="formState.amountMax" :precision="2" />
        </a-form-item>
        <a-form-item label="经办人">
          <a-input v-model:value="formState.handlerUserName" :maxlength="50" allow-clear placeholder="请输入" />
        </a-form-item>
        <a-form-item label="经办部门"  :label-col="{ style: { width: '70px' } }">
          <cascaderCheck class="select-placeholder" v-model:value="formState.handlerDeptId" :options="deptList"
            :field-names="{
              label: 'name',
              value: 'id',
              children: 'children',
            }" show-search tree-node-filter-prop="name" tree-default-expand-all tree-data-simple-mode placeholder="全部"
            allow-clear />
        </a-form-item>
        <div style="width: 100%; padding-left: 75px">
          <a-form-item label="">
            <a-button class="mg-l-1" @click="onReset">重 置</a-button>
            <a-button class="mg-l-1" type="primary" @click="onSearch">查 询</a-button>
          </a-form-item>
        </div>
      </a-form>
    </SearchCard>
    <div class="card_table mg-t-medium">
      <a-table row-key="id" :columns="columns" :data-source="dataSource" :loading="loadTable" :pagination="searchQuery"
        :row-selection="rowSelection" :scroll="{ x: 2000 }" @change="handleTableChange">
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
          <template v-else-if="column.dataIndex === 'contractName'">
            <a-tooltip :title="text">
              <span class="cell-text-ellipsis">{{ text || '-' }}</span>
            </a-tooltip>
          </template>
          <template v-else-if="column.dataIndex === 'contractNo'">
            <a-tooltip :title="text">
              <span class="cell-text-ellipsis">{{ text || '-' }}</span>
            </a-tooltip>
          </template>
          <template v-else-if="column.dataIndex === 'contractCategory'">
            {{ categoryOptionsWithAll.obj[text]?.label || categoryOptionsWithAll.obj[Number(text)]?.label || '-' }}
          </template>
          <template v-else-if="column.dataIndex === 'amountTaxIncluded'">
            {{ nFormat(text, 2) }}
          </template>
          <template v-else-if="column.dataIndex === 'status'">
            <span class="tag_base" :class="contractStatusList.obj[text]?.class || ''">
              {{ contractStatusList.obj[text]?.label || '-' }}
            </span>
          </template>
        </template>
      </a-table>
    </div>
    <template #footer>
      <a-button class="mg-r-small" @click="onClose">取 消</a-button>
      <a-button type="primary" @click="onConfirm">下一步</a-button>
    </template>
  </a-drawer>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import SearchCard from '@/components/system/SearchCard.vue'
import groupNum from '@/components/system/groupNum.vue'
import cascaderCheck from '@/components/system/cascaderCheck.vue'
import useTable from '@/hook/useTable.js'
import { contractStatusList } from '../../hookMap.js'
import { getIntentionContractList } from '@/api/Contract/intention'

defineOptions({ name: 'ImportIntentionDrawer' })

const sortDate = (a, b, field) => {
  const av = a[field] ? String(a[field]) : ''
  const bv = b[field] ? String(b[field]) : ''
  return av.localeCompare(bv)
}

function formatOurCompanies(record) {
  return record?.ourCompanyRelations?.map((item) => item.companyName).join('、') || ''
}

function formatCounterparties(record) {
  return record?.counterpartyRelations?.map((item) => item.counterpartyName).join('、') || ''
}

const columns = [
  { title: '序号', dataIndex: 'index', key: 'index', width: 60 },
  { title: '合同名称', dataIndex: 'contractName', key: 'contractName', width: 180 },
  { title: '合同号', dataIndex: 'contractNo', key: 'contractNo', width: 130, ellipsis: true },
  { title: '合同分类', dataIndex: 'contractCategory', key: 'contractCategory', width: 120 },
  {
    title: '我方主体',
    dataIndex: 'ourCompanyRelations',
    key: 'ourCompanyRelations',
    width: 180,
  },
  { title: '品牌', dataIndex: 'brandName', key: 'brandName', width: 100 },
  {
    title: '对方客商',
    dataIndex: 'counterpartyRelations',
    key: 'counterpartyRelations',
    width: 180,
  },
  { title: '合同金额(元)', dataIndex: 'amountTaxIncluded', key: 'amountTaxIncluded', width: 100 },
  { title: '合同签署人', dataIndex: 'signUserName', key: 'signUserName', width: 108 },
  {
    title: '签约日期',
    dataIndex: 'signDate',
    key: 'signDate',
    width: 100,
    sorter: (a, b) => sortDate(a, b, 'signDate'),
  },
  {
    title: '合同开始日期',
    dataIndex: 'startDate',
    key: 'startDate',
    width: 120,
    sorter: true,
  },
  {
    title: '合同结束日期',
    dataIndex: 'endDate',
    key: 'endDate',
    width: 120,
    sorter: true,
  },
  { title: '经办人', dataIndex: 'handlerUserName', key: 'handlerUserName', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 60, fixed: 'right' },
]

const props = defineProps({
  open: { type: Boolean, default: false },
  subjectOptionsWithAll: {
    type: Object,
    default: () => ({ arr: [], obj: {}, all: [] }),
  },
  categoryOptionsWithAll: { type: Object, required: true },
  deptList: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:open', 'submit'])

const getApi = async (query) => {
  const { data, total } = await getIntentionContractList(query)
  return { data: data.data, total: data.total }
}

const getSearchQuery = (query) => {
  if (query.signDateRange) {
    query.signDateStart = query.signDateRange[0]
    query.signDateEnd = query.signDateRange[1]
    delete query.signDateRange
  }
  if (query.dateRange) {
    query.startDateStart = query.dateRange[0]
    query.startDateEnd = query.dateRange[1]
    delete query.dateRange
  }
  if (query.handlerDeptId) {
    query.handlerDeptId = query.handlerDeptId
  }
  query.status = 2
  return query
}

const selectedRow = ref(null)

const rowSelection = computed(() => ({
  type: 'radio',
  selections: false,
  preserveSelectedRowKeys: true,
  selectedRowKeys: selectedRow.value?.id != null ? [selectedRow.value.id] : [],
  onChange: (_keys, rows) => {
    selectedRow.value = rows?.[0] ?? null
  },
}))

const {
  formState,
  dataSource,
  searchQuery,
  handleTableChange,
  search,
  reset,
  loadTable,
  getList,
  nFormat,
} = useTable(getApi, {
  current: 1,
  pageSize: 8,
  pageSizeOptions: ['8', '10', '20', '50'],
}, { getSearchQuery })

function onSearch() {
  selectedRow.value = null
  search()
}

function onReset() {
  selectedRow.value = null
  reset()
}

function onClose() {
  emit('update:open', false)
}

function onConfirm() {
  const rec = selectedRow.value
  if (!rec) {
    message.warning('请选择要引入的合同')
    return
  }
  emit('submit', rec)
  onClose()
}

watch(
  () => props.open,
  async (v) => {
    if (!v) {
      selectedRow.value = null
      return
    }
    selectedRow.value = null
    await getList()
  },
)
</script>
<style lang="scss">
.import-intention-drawer {
  .ant-drawer-body {
    padding: 8px 16px 16px !important;
  }
}
</style>