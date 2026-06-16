<template>
  <div>
    <a-button v-if="!isDetail" class="mg-b-1" type="primary" size="small" @click="openDrawer">添加关联合同</a-button>
    <a-table :bordered="dataSource.length > 0" row-key="seq" :columns="columns" :data-source="dataSource"
      :pagination="false" :scroll="{ x: 1380 }">
      <template #bodyCell="{ column, index, record }">
        <template v-if="column.key === 'action'">
          <a-button :disabled="record.isAuto == 1" type="link" danger size="small"
            @click="removeRow(index)">删除</a-button>
        </template>
        <template v-else-if="column.key === 'contractName'">
          <a-tooltip
            :title="record.status === 5 && isDetail ? record.terminationDetail?.finalName : record.contractName">
            <span v-if="record.status === 5 && isDetail" class="cell-text-ellipsis">
              {{ record.terminationDetail?.finalName || '-' }}
            </span>
            <span v-else class="cell-text-ellipsis">{{ record.contractName || '-' }}</span>
          </a-tooltip>
        </template>
        <template v-else-if="column.key === 'contractNo'">
          <a-button v-if="record.status === 5 && isDetail" type="link" @click="handleOpenTerminationDetail(record)"
            class="tag_base tag_yzz mg-r-small">
            {{ record.terminationDetail?.finalCode || '-' }}
          </a-button>
          <a-button type="link" v-else @click="handleContractNoClick(record)">{{ record.contractNo || '-' }}</a-button>
        </template>
        <template v-else-if="column.key === 'ourCompanyRelations'">
          <a-tooltip :title="formatOurCompanies(record)">
            <span class="cell-text-ellipsis">{{ formatOurCompanies(record) || '-' }}</span>
          </a-tooltip>
        </template>
        <template v-else-if="column.key === 'counterpartyRelations'">
          <a-tooltip :title="formatCounterparties(record)">
            <span class="cell-text-ellipsis">{{ formatCounterparties(record) || '-' }}</span>
          </a-tooltip>
        </template>
        <template v-else-if="column.key === 'amountTaxIncluded'">
          <span v-if="record.status === 5 && isDetail" class="cell-text-ellipsis">
            {{ '-' }}
          </span>
          <span v-else class="cell-text-ellipsis">
            {{ record.amountTaxIncluded || '-' }}
          </span>
        </template>
      </template>
    </a-table>

    <AddRelatedContractDrawer :brandOptionsWithAll="brandOptionsWithAll"
      :subjectOptionsWithAll="subjectOptionsWithAll" v-model:open="drawerOpen" :selectedContractNos="dataSource"
      @confirm="onDrawerConfirm" />
    <TerminationDetailModal v-model:open="terminationDetailOpen" :detail="terminationDetail" />
  </div>
</template>

<script setup>
defineOptions({
  name: 'IntentionBusinessSection',
})
import { computed, ref } from 'vue'
import { message } from 'ant-design-vue'
import AddRelatedContractDrawer from './modals/AddRelatedContractDrawer.vue'
import TerminationDetailModal from '../Lifecycle/modals/TerminationDetailModal.vue'
import { useRouter } from 'vue-router'
import { getDateRangeApproxMonths } from '@/utils/com.js'
import { categoryOptionsWithAll, contractTypeList } from '../hookMap.js'

const router = useRouter()
const terminationDetailOpen = ref(false)
const terminationDetail = ref(null)

function handleOpenTerminationDetail(record) {
  if (!record.terminationDetail) {
    message.warning('暂无终止详情')
    return
  }
  terminationDetail.value = record.terminationDetail
  terminationDetailOpen.value = true
}

const handleContractNoClick = (record) => {
  router.push({
    path: '/contract/Lifecycle/detail', query: {
      id: record.id,
    }
  })
}
const props = defineProps({
  dataSource: {
    type: Array,
    default: () => [],
  },
  isDetail: {
    type: Boolean,
    default: false,
  },
  brandOptionsWithAll: {
    type: Object,
    default: () => ({}),
  },
  subjectOptionsWithAll: {
    type: Array,
    default: () => [],
  },
})

function formatContractCategory(record) {
  const v = record.contractCategory
  return categoryOptionsWithAll.obj[v]?.label || categoryOptionsWithAll.obj[Number(v)]?.label || v || '-'
}

function formatContractAttribute(record) {
  if (record.status === 5) return '终止合同'
  return record.contractAttribute || '-'
}

function formatContractType(record) {
  if (record.status === 5) return '终止'
  const v = record.contractType
  return contractTypeList.obj[Number(v)]?.label ?? contractTypeList.obj[v]?.label ?? v ?? '-'
}

const dataSource = computed(() => {
  return (props.dataSource || []).map((item) => {
    const row = {
      ...item,
      contractAttributeText: formatContractAttribute(item),
      contractTypeText: formatContractType(item),
      contractCategoryText: formatContractCategory(item),
    }
    if (item.status !== 5) return row
    const finals = item.contractFinal
    if (!finals?.length) return row
    const detail = finals.find((f) => f.finalStatus === 2)
    if (!detail) return row
    return {
      ...row,
      terminationDetail: detail,
    }
  })
})

const emit = defineEmits(['update:dataSource'])

const drawerOpen = ref(false)

function formatOurCompanies(record) {
  return record?.ourCompanyRelations?.map((r) => r.companyName).filter(Boolean).join('、') || ''
}

function formatCounterparties(record) {
  return record?.counterpartyRelations?.map((r) => r.counterpartyName).filter(Boolean).join('、') || ''
}

const columns = []

if (props.isDetail) {
  columns.push(
    { title: '合同属性', dataIndex: 'contractAttributeText', key: 'contractAttributeText', width: 100 },
    { title: '合同类型', dataIndex: 'contractTypeText', key: 'contractTypeText', width: 90 },
    { title: '合同分类', dataIndex: 'contractCategoryText', key: 'contractCategoryText', width: 110 },
  )
}

columns.push(
  { title: '合同名称', dataIndex: 'contractName', key: 'contractName', width: 220, ellipsis: true },
  {
    title: '合同号',
    customRender: ({ record }) => {
      return record.contractNo || '-';
    },
    dataIndex: 'contractNo', key: 'contractNo', width: 140
  },

  { title: '我方主体', dataIndex: 'ourCompanyRelations', key: 'ourCompanyRelations', width: 180, ellipsis: true },
  { title: '对方客商', dataIndex: 'counterpartyRelations', key: 'counterpartyRelations', width: 160, ellipsis: true },
  { title: '合同金额(¥)', dataIndex: 'amountTaxIncluded', key: 'amountTaxIncluded', width: 120 },
  {
    title: '合同期限(月)', dataIndex: 'periodMonth', key: 'periodMonth', width: 110,
    customRender: ({ record }) => {
      const range = [record.startDate, record.endDate]
      const m = getDateRangeApproxMonths(range)
      return m
    },
  },
  {
    title: '合同起止日期', dataIndex: 'contractDateText', key: 'contractDateText', width: 210,
    customRender: ({ record }) => {
      return record.startDate + ' 至 ' + record.endDate
    },
  },
)

if (!props.isDetail) {
  columns.push({ title: '操作', key: 'action', width: 50, fixed: 'right' })
}

function openDrawer() {
  drawerOpen.value = true
}

function onDrawerConfirm(rows) {
  const list = [...rows]
  emit('update:dataSource', list)
}

function removeRow(index) {
  const list = [...(props.dataSource || [])]
  list.splice(index, 1)
  emit('update:dataSource', list)
}
</script>

<style lang="scss" scoped></style>
