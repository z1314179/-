<template>
  <a-drawer class="add-related-contract-drawer" :open="open" title="添加关联合同" placement="right" width="1140px"
    destroy-on-close @close="onClose">
    <SearchCard :is-exp="false" style="padding: 0">
      <a-form layout="inline" autocomplete="off" :label-col="{ style: { width: '98px' } }">
        <a-form-item label="合同名称" :label-col="{ style: { width: '70px' } }">
          <a-input v-model:value="formState.contractName" allow-clear placeholder="请输入" />
        </a-form-item>
        <a-form-item label="对方客商" :label-col="{ style: { width: '70px' } }">
          <a-input v-model:value="formState.counterpartyName" allow-clear placeholder="请输入" />
        </a-form-item>
        <a-form-item label="我方主体">
          <a-select class="select-placeholder" allow-clear v-model:value="formState.ourCompanyId"
            :options="subjectOptionsWithAll" :fieldNames="{
              label: 'companyName',
              value: 'id',
            }" placeholder="全部" />
        </a-form-item>
        <a-form-item label="品牌" :label-col="{ style: { width: '70px' } }">
          <a-select class="select-placeholder" allow-clear v-model:value="formState.brandName"
            :options="brandOptionsWithAll.arr" :fieldNames="{
              label: 'label',
              value: 'value',
            }" placeholder="全部" />
        </a-form-item>
        <a-form-item label="经办人" :label-col="{ style: { width: '70px' } }">
          <a-input v-model:value="formState.handlerUserName" allow-clear placeholder="请输入" />
        </a-form-item>
        <a-form-item label="合同开始日期">
          <a-range-picker v-model:value="formState.validityDateRange" value-format="YYYY-MM-DD"
            :placeholder="['开始日期', '结束日期']" allow-clear />
        </a-form-item>
        <div style="width: 100%; padding-left: 75px">
          <a-form-item label="">
            <a-button class="mg-l-1" @click="onReset">重 置</a-button>
            <a-button class="mg-l-1" type="primary" @click="search">查 询</a-button>
          </a-form-item>
        </div>
      </a-form>
    </SearchCard>
    <div class="selected-tip">已选择 {{ selectedKeys.length }} 项数据</div>
    <div class="card_table">
      <a-table row-key="id" :columns="columns" :data-source="dataSource" :loading="loadTable" :pagination="searchQuery"
        :row-selection="rowSelection" :scroll="{ x: 1580 }" @change="handleTableChange">
        <template #bodyCell="{ column, text, record }">
          <template v-if="column.dataIndex === 'contractName'">
            <a-tooltip :title="record.contractName">
              <span class="cell-text-ellipsis">{{ record.contractName || '-' }}</span>
            </a-tooltip>
          </template>
          <template v-else-if="column.dataIndex === 'contractNo'">
            {{ record.contractNo || '-' }}
          </template>
          <template v-else-if="column.dataIndex === 'contractCategory'">
            {{ categoryOptionsWithAll.obj[text]?.label || categoryOptionsWithAll.obj[Number(text)]?.label || '-' }}
          </template>
          <template v-else-if="column.dataIndex === 'ourCompanyRelations'">
            <a-tooltip :title="formatOurCompanies(record)">
              <span class="cell-text-ellipsis">{{ formatOurCompanies(record) || '-' }}</span>
            </a-tooltip>
          </template>
          <template v-else-if="column.dataIndex === 'brandName'">
            <a-tooltip :title="record.brandName">
              <span class="cell-text-ellipsis">{{ record.brandName || '-' }}</span>
            </a-tooltip>
          </template>
          <template v-else-if="column.dataIndex === 'counterpartyRelations'">
            <a-tooltip :title="formatCounterparties(record)">
              <span class="cell-text-ellipsis">{{ formatCounterparties(record) || '-' }}</span>
            </a-tooltip>
          </template>
          <template v-else-if="column.dataIndex === 'amountTaxIncluded'">
            {{ text != null && text !== '' ? nFormat(text, 2) : '-' }}
          </template>
          <template v-else-if="column.dataIndex === 'status'">
            <span class="tag_base" :class="contractStatusObj[text]?.class || ''">
              {{ contractStatusObj[text]?.label || '-' }}
            </span>
          </template>
        </template>
      </a-table>
    </div>
    <template #footer>
      <a-button class="mg-r-small" @click="onClose">取消</a-button>
      <a-button type="primary" @click="onSave">保存</a-button>
    </template>
  </a-drawer>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import SearchCard from '@/components/system/SearchCard.vue'
import useTable from '@/hook/useTable.js'
import { getContractList } from '@/api/Contract/lifecycle'
import { categoryOptionsWithAll } from '@/views/Contract/hookMap.js'
import { nFormat } from '@/utils/com.js'
defineOptions({ name: 'AddRelatedContractDrawer' })
import { contractStatusFn } from '@/utils/codeMap/basic'
const { contractStatusObj } = contractStatusFn()
const props = defineProps({
  open: { type: Boolean, default: false },
  /** 主表已有行的合同号，用于打开时恢复勾选 */
  selectedContractNos: { type: Array, default: () => [] },
  brandOptionsWithAll: { type: Object, default: () => [] },
  subjectOptionsWithAll: { type: Array, default: () => [] },
  /** 自动带入的合同 id 列表 */
})

const emit = defineEmits(['update:open', 'confirm'])
const isAutoContracts = computed(() => props.selectedContractNos.filter((e) => e.isAuto == 1).map((e) => e.id));
function formatOurCompanies(record) {
  return record?.ourCompanyRelations?.map((r) => r.companyName).filter(Boolean).join('、') || ''
}

function formatCounterparties(record) {
  return record?.counterpartyRelations?.map((r) => r.counterpartyName).filter(Boolean).join('、') || ''
}

const columns = [
  { title: '合同名称', dataIndex: 'contractName', key: 'contractName', width: 180, },
  { title: '合同号', dataIndex: 'contractNo', key: 'contractNo', width: 130, },
  { title: '合同分类', dataIndex: 'contractCategory', key: 'contractCategory', width: 100 },
  { title: '我方主体', dataIndex: 'ourCompanyRelations', key: 'ourCompanyRelations', width: 160, },
  { title: '品牌', dataIndex: 'brandName', key: 'brandName', width: 80, },
  { title: '对方客商', dataIndex: 'counterpartyRelations', key: 'counterpartyRelations', width: 140, },

  { title: '合同金额(元)', dataIndex: 'amountTaxIncluded', key: 'amountTaxIncluded', width: 110 },
  { title: '合同签署人', dataIndex: 'signUserName', key: 'signUserName', width: 100, },
  { title: '签约日期', dataIndex: 'signDate', key: 'signDate', width: 110, sorter: true },
  { title: '合同开始日期', dataIndex: 'startDate', key: 'startDate', width: 120, sorter: true },
  { title: '合同结束日期', dataIndex: 'endDate', key: 'endDate', width: 120, sorter: true },
  { title: '经办人', dataIndex: 'handlerUserName', key: 'handlerUserName', width: 90, },
  { title: '状态', dataIndex: 'status', key: 'status', width: 88, fixed: 'right' },
]

const selectedKeys = ref([])

const rowSelection = computed(() => ({
  selections: false,
  preserveSelectedRowKeys: true,
  selectedRowKeys: selectedKeys.value.filter((e) => e?.id).map((e) => e.id),
  onChange: (nextKeys, selectedRows) => {
    const map = new Map()
    for (const row of [...selectedKeys.value, ...selectedRows]) {
      if (row?.id) map.set(String(row.id), row)
    }
    selectedKeys.value = nextKeys.map((k) => map.get(String(k))).filter(Boolean)
  },
  getCheckboxProps: (record) => ({
    disabled: isAutoContracts.value.includes(record.id),
  }),
}))
const getApi = async (query) => {

  const { data } = await getContractList(query)
  return { data: data.data, total: data.total }
}
const getSearchQuery = (query) => {
  query.status = [4, 5, 6, 7, 10, 11]
  if (query.validityDateRange) {
    query.startDateStart = query.validityDateRange[0]
    query.startDateEnd = query.validityDateRange[1]
    delete query.validityDateRange
  }
  return query
}
const {
  formState,
  dataSource,
  searchQuery,
  handleTableChange,
  search,
  reset,
  loadTable,
  getList,
} = useTable(getApi, {
  current: 1,
  pageSize: 10,
  pageSizeOptions: ['10', '20', '50'],
}, { getSearchQuery: getSearchQuery })

function onReset() {
  reset()
}
function onClose() {
  emit('update:open', false)
}
function onSave() {
  const rest = [...selectedKeys.value]
  if (!rest.length) {
    message.warning('请选择要添加的合同')
    return
  }
  rest.forEach((e) => {
    e.isAuto = isAutoContracts.value.includes(e.id) ? 1 : 0
  })
  emit('confirm', rest)
  onClose()
}

watch(
  () => props.open,
  async (v) => {
    if (!v) {
      selectedKeys.value = []
      searchQuery.current = 1
      dataSource.value = []
      searchQuery.total = 0
      return
    }
    selectedKeys.value = [...props.selectedContractNos.filter((e) => e?.id)]
    // await getList()

  },
)
</script>

<style lang="scss" scoped>
.selected-tip {
  font-weight: 400;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  margin-top: 8px;
  margin-bottom: 4px;
}
</style>
<style lang="scss">
.add-related-contract-drawer {
  .ant-drawer-body {
    padding: 8px 16px 16px !important;
  }
}
</style>
