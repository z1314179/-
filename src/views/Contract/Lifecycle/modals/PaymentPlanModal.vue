<template>

  <a-modal :open="open" :title="titleStr" :mask-closable="false" width="1140px" destroy-on-close @cancel="onClose">

    <div class="card_table">

      <a-table row-key="billNo" :columns="columns" :data-source="dataSource" :loading="loadTable"
        :pagination="searchQuery" :scroll="{ x: 1320 }" @change="handleTableChange">

        <template #bodyCell="{ column, text, record, index }">

          <template v-if="column.dataIndex === 'index'">

            {{ (searchQuery.current - 1) * searchQuery.pageSize + index + 1 }}

          </template>

          <template
            v-else-if="['contractNo', 'contractName', 'companyName', 'counterpartyName', 'billNo', 'expenseTypeName', 'currency'].includes(column.dataIndex)">
            <a-tooltip :title="formatCellText(column.dataIndex, record, text)">
              <span class="cell-text-ellipsis">{{ formatCellText(column.dataIndex, record, text) }}</span>
            </a-tooltip>
          </template>

          <template v-else-if="column.dataIndex === 'amount'">
            {{ nFormat(text, 2) }}
          </template>

        </template>

      </a-table>

    </div>

    <template #footer>

      <div class="text-right">

        <a-button @click="onClose">关 闭</a-button>

      </div>

    </template>

  </a-modal>

</template>



<script setup>

import { watch, computed } from 'vue'

import useTable from '@/hook/useTable.js'
import { currencyFn } from '@/utils/codeMap/basic.js'
import { getContractBillList } from '@/api/Contract/lifecycle.js'



defineOptions({ name: 'LifecyclePaymentPlanModal' })



const props = defineProps({

  open: { type: Boolean, default: false },

  /** 合同列表行，含 id */

  detail: { type: Object, default: null },

})
/** planType：1 付款（支出）/ 应付，2 收款（收入）/ 应收 */
const isPayPlan = computed(() => Number(props.detail?.planType) === 1)

const titleStr = computed(() => (isPayPlan.value ? '付款明细' : '收款明细'))

const planLabelPrefix = computed(() => (isPayPlan.value ? '应付' : '应收'))
const { currencyObj } = currencyFn()

const emit = defineEmits(['update:open'])

const columns = computed(() => [
  { title: '序号', dataIndex: 'index', key: 'index', width: 60 },
  { title: '合同号', dataIndex: 'contractNo', key: 'contractNo', width: 130 },
  { title: '合同名称', dataIndex: 'contractName', key: 'contractName', width: 200 },
  { title: '我方主体', dataIndex: 'companyName', key: 'companyName', width: 200 },
  { title: '对方客商', dataIndex: 'counterpartyName', key: 'counterpartyName', width: 200 },
  { title: isPayPlan.value ? '付款申请单号' : '收款申请单号', dataIndex: 'billNo', key: 'billNo', width: 140 },
  { title: '费用类型', dataIndex: 'expenseTypeName', key: 'expenseTypeName', width: 120 },
  { title: '币种', dataIndex: 'currency', key: 'currency', width: 90 },
  { title: `${planLabelPrefix.value}金额`, dataIndex: 'amount', key: 'amount', width: 130 },
])

function formatOurCompanies(record) {
  return record?.ourCompanyRelations?.map((item) => item.companyName).join('、') || ''
}

function formatCounterparties(record) {
  return record?.counterpartyRelations?.map((item) => item.counterpartyName).join('、') || ''
}

function formatCellText(dataIndex, record, text) {
  if (dataIndex === 'expenseTypeName') {
    return record?.expenseTypeName || record?.expenseType || '-'
  }
  if (dataIndex === 'currency') {
    return currencyObj[text]?.label || record?.currencyName || text || '-'
  }
  return text || '-'
}







const getApi = async (query) => {
  const detail = props.detail
  if (!detail) return { data: [], total: 0 }

  if (detail.id) {
    const res = await getContractBillList({ id: detail.id, ...query })
    const payload = res?.data ?? {}
    const list = payload?.data ?? payload ?? []
    const rows = (Array.isArray(list) ? list : []).map((e) => ({
      ...e,
      contractName: e.contractName ?? detail.contractName,
      contractNo: e.contractNo ?? detail.contractNo,
      companyName: e.companyName ?? formatOurCompanies(detail),
      counterpartyName: e.counterpartyName ?? formatCounterparties(detail),
    }))
    return { data: rows, total: payload?.total ?? rows.length }
  }

  const arr = (detail.paymentPlans || []).map((e) => ({
    ...e,
    contractName: detail.contractName,
    contractNo: detail.contractNo,
    companyName: formatOurCompanies(detail),
    counterpartyName: formatCounterparties(detail),
  }))
  return { data: arr, total: arr.length }
}



const {

  dataSource,

  loadTable,

  searchQuery,

  handleTableChange,

  search,

  nFormat,

} = useTable(getApi, {

  current: 1,

  pageSize: 8,

  pageSizeOptions: ['8', '10', '20', '50'],

})



watch(

  () => props.open,

  (v) => {

    if (!v) return

    search()

  },

)



function onClose() {
  emit('update:open', false)
}

</script>
