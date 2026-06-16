<template>
  <div>
    <div class="payment-plan flex align-center justify-center pd-y-small mg-t-small">
      <div style="margin: 0 50px" class="flex flex-column align-center justify-center">
        <div style="font-weight: 500">{{ contractAmountTaxIncludedDisplay }}</div>
        <div style="margin-top: 4px; font-size: 12px; color: rgba(0, 0, 0, 0.45)">合同总金额</div>
      </div>
      <div style="margin: 0 50px" class="flex flex-column align-center justify-center">
        <div style="font-weight: 500">{{ ratioSumDisplay }}</div>
        <div style="margin-top: 4px; font-size: 12px; color: rgba(0, 0, 0, 0.45)">比例合计(%)</div>
      </div>
      <div style="margin: 0 50px" class="flex flex-column align-center justify-center">
        <div style="font-weight: 500">{{ createdDisplay }}</div>
        <div style="margin-top: 4px; font-size: 12px; color: rgba(0, 0, 0, 0.45)">已创建金额</div>
      </div>
      <div style="margin: 0 50px" class="flex flex-column align-center justify-center">
        <div style="font-weight: 500">{{ uncreatedDisplay }}</div>
        <div style="margin-top: 4px; font-size: 12px; color: rgba(0, 0, 0, 0.45)">未创建金额</div>
      </div>
    </div>

    <div v-if="!isDetail" class="mg-y-1">
      <a-button type="primary" size="small" @click="addRow">添加明细</a-button>
      <a-button size="small" class="mg-l-1" @click="openOneClickModal">一键分摊</a-button>
    </div>
    <a-table :columns="columns" :data-source="props.formState.budgetSplits" :pagination="false" row-key="seq"
      :scroll="{ x: 1040 }" class="table mg-t-1">
      <template #headerCell="{ column }">
        <template v-if="['expenseTypeCode', 'budgetDate', 'ratio', 'amount', 'dept'].includes(column.key)">
          <span :class="isDetail ? '' : 'header-required-a'">{{ column.title }}</span>
        </template>
      </template>
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'seq'">{{ index + 1 }}</template>
        <template v-else-if="column.key === 'expenseTypeCode'">
          <template v-if="isDetail">
            <span> {{ expenseTypeOptionsWithAll?.obj[record.expenseTypeCode]?.value || record.expenseTypeCode }}</span>
          </template>
          <a-form-item v-else label="" :name="['budgetSplits', index, 'expenseTypeCode']"
            :rules="[{ required: !isDetail, message: '请选择费用类型' }]">
            <a-select placeholder="请选择" showSearch option-filter-prop="value" v-model:value="record.expenseTypeCode"
              :options="expenseTypeOptionsWithAll.arr" :fieldNames="{ label: 'value', value: 'key' }"
              @change="(val) => onExpenseTypeChange(record, val)" />
          </a-form-item>
        </template>
        <template v-else-if="column.key === 'budgetDate'">
          <template v-if="isDetail">
            <span>{{ record.budgetDate }}</span>
          </template>
          <a-form-item v-else label="" :name="['budgetSplits', index, 'budgetDate']"
            :rules="[{ required: !isDetail, message: '请选择预算日期' }]">
            <a-date-picker v-model:value="record.budgetDate" value-format="YYYY-MM" picker="month" placeholder="请选择" />
          </a-form-item>
        </template>
        <template v-else-if="column.key === 'ratio'">
          <template v-if="isDetail">
            <span>{{toFixedNumberString(record.ratio) }}</span>
          </template>
          <a-form-item v-else label="" :name="['budgetSplits', index, 'ratio']"
            :rules="[{ required: !isDetail, message: '请输入比例' }]">
            <a-input-number v-model:value="record.ratio" placeholder="请输入" :controls="false" :precision="2" :min="0"
              :max="maxRatioForRow(index)" @blur="() => onBudgetSplitRatioBlur(record, index)" />
          </a-form-item>
        </template>
        <template v-else-if="column.key === 'amount'">
          <template v-if="isDetail">
            <span>{{ toFixedNumberString(record.amount) }}</span>
          </template>
          <a-form-item v-else label="" :name="['budgetSplits', index, 'amount']"
            :rules="[{ required: !isDetail, message: '请输入金额' }]">
            <a-input-number v-model:value="record.amount" :controls="false" placeholder="请输入" :min="0" :precision="2"
              :max="maxAmountForRow(index)" @blur="() => onBudgetSplitAmountBlur(record, index)" />
          </a-form-item>
        </template>
        <template v-else-if="column.key === 'dept'">
          <template v-if="isDetail">
            <span>{{ record.deptName }}</span>
          </template>
          <a-form-item v-else label="" :name="['budgetSplits', index, 'deptId']"
            :rules="[{ required: !isDetail, message: '请选择所属部门' }]">
            <cascaderCheck style="width: 100%" v-model:value="record.deptId" :options="deptList"
              :field-names="deptFieldNames" show-search tree-node-filter-prop="name" tree-default-expand-all
              tree-data-simple-mode placeholder="请选择" allow-clear @change="(val) => onDeptChange(record, val)" />
          </a-form-item>
        </template>
        <template v-else-if="column.key === 'remark'">
          <template v-if="isDetail">
            <span>{{ record.remark || '-' }}</span>
          </template>
          <a-form-item v-else label="" :name="['budgetSplits', index, 'remark']">
            <a-input v-model:value="record.remark" placeholder="请输入" />
          </a-form-item>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button v-if="!isDetail" type="link" @click="removeRow(index)">删除</a-button>
        </template>
      </template>
    </a-table>
    <BudgetOneClickSplitModal :form-state="props.formState" v-model:open="oneClickModalOpen"
      :expense-type-options-with-all="expenseTypeOptionsWithAll" @save="handleOneClickModalSave" />
  </div>
</template>

<script setup>
import { computed, nextTick, ref, unref } from 'vue'
import { handleParseint, toFixedNumberString } from '@/utils/com.js'
import cascaderCheck from '@/components/system/cascaderCheck.vue'
import BudgetOneClickSplitModal from './modals/BudgetOneClickSplitModal.vue'

defineOptions({ name: 'BudgetSplitTable' })


const deptFieldNames = { label: 'name', value: 'id', children: 'children' }

const props = defineProps({
  formState: { type: Object, required: true },
  isDetail: { type: Boolean, default: false },
  /** 外层 a-form 的 ref，用于金额/比例联动校验 */
  formRef: { type: Object, default: null },
  expenseTypeOptionsWithAll: { type: Object, default: () => ({}) },
  /** 与意向列表 `Intention/index.vue` 经办部门一致：来自 `hookMap()` 内的 `useTabs({ dept: true })` */
  deptList: { type: Array, default: () => [] },
  deptListMap: { type: Object, default: () => ({}) },
})

const oneClickModalOpen = ref(false)
function openOneClickModal() {
  if (props.isDetail) return
  oneClickModalOpen.value = true
}

function onExpenseTypeChange(record, code) {
  record.expenseTypeName = code
    ? props.expenseTypeOptionsWithAll?.obj?.[code]?.value
    : undefined
}

function onDeptChange(record, deptId) {
  record.deptName = deptId != null && deptId !== ''
    ? props.deptListMap?.[deptId]?.name
    : undefined
}

function handleOneClickModalSave(payload) {
  if (!Array.isArray(payload)) return
  props.formState.budgetSplits = payload.map((row) => {
    const code = row?.expenseType
    return {
      amount: row?.amount,
      ratio: row?.ratio,
      expenseTypeCode: code,
      budgetDate: row?.budgetDate,
    }
  })
}

const baseColumns = [
  { title: '期数', key: 'seq', width: 60 },
  { title: '费用类型', key: 'expenseTypeCode', width: 130 },
  { title: '预算日期', key: 'budgetDate', width: 170 },
  { title: '比例', key: 'ratio', width: 100 },
  { title: '金额(元)', key: 'amount', width: 130 },
  { title: '所属部门', key: 'dept', width: 130 },
  { title: '备注', key: 'remark', width: 330 },
]

const columns = computed(() => {
  const c = [...baseColumns]
  if (!props.isDetail) {
    c.push({ title: '操作', key: 'action', width: 50, fixed: 'right' })
  }
  return c
})


const toNum = (v) => Number(String(v ?? 0).replace(/,/g, '')) || 0
const fixed2 = (n) =>
  n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const contractTotalNum = computed(() => Math.max(0, toNum(props.formState.amountTaxIncluded)))

/** 本行金额上限：合同总额（分）− 其它行已填金额；比例上限由 maxRatioForRow 约束，失焦时吃尾差对齐 */
function maxAmountForRow(index) {
  const cap = contractTotalNum.value
  if (!cap) return 0
  const plans = props.formState.budgetSplits || []
  const capCents = Math.round(cap * 100)
  const othersCents = plans.reduce(
    (s, r, i) => (i !== index ? s + Math.round(toNum(r.amount) * 100) : s),
    0,
  )
  return Math.max(0, Number(((capCents - othersCents) / 100).toFixed(2)))
}

/** 除本行外，各表行已填比例之和（空/非数字按 0） */
function sumRatioExcludingIndex(plans, index) {
  const list = plans || []
  return list.reduce((s, r, i) => (i !== index ? s + toNum(r.ratio) : s), 0)
}

/** 本行比例上限：全表比例合计不超 100%（金额上限由 maxAmountForRow 约束，失焦时吃尾差对齐） */
function maxRatioForRow(index) {
  const plans = props.formState.budgetSplits || []
  const sumOthers = sumRatioExcludingIndex(plans, index)
  return Math.min(100, Math.max(0, Math.round((100 - sumOthers) * 100) / 100))
}

/** 累计比例达到 100%（按百分数两位小数）时视为收尾行，用于吃尾差 */
function ratioSumReachedFull(sumRatio) {
  return Math.round(sumRatio * 100) >= 10000
}

/** 各行金额合计达到合同总额（按分）时视为满额，用于比例吃尾差 */
function amountSumReachedFull(sumAmtYuan, capYuan) {
  return Math.round(sumAmtYuan * 100) >= Math.round(capYuan * 100)
}

function validateBudgetSplitField(index, field) {
  if (props.isDetail || index == null || index < 0) return
  const form = unref(props.formRef)
  form?.validateFields([['budgetSplits', index, field]]).catch(() => { })
}

/** 失去焦点：本行金额 → 本行比例（与收付计划 PaymentPlanTable 一致） */
async function onBudgetSplitAmountBlur(row, index) {
  if (props.isDetail) return
  const v = row.amount
  if (v === null || v === undefined || v === '') {
    row.ratio = undefined
    await nextTick()
    validateBudgetSplitField(index, 'ratio')
    return
  }
  const cap = contractTotalNum.value
  if (!cap) {
    row.ratio = undefined
    await nextTick()
    validateBudgetSplitField(index, 'ratio')
    return
  }
  const plans = props.formState.budgetSplits || []
  const amountSum = plans.reduce((s, r) => s + toNum(r?.amount), 0)
  const ratioSum = plans.reduce((s, r) => s + toNum(r?.ratio), 0)
  if (amountSumReachedFull(amountSum, cap) && !ratioSumReachedFull(ratioSum)) {
    const sumOthersRat = plans.reduce((s, r) => (r === row ? s : s + toNum(r?.ratio)), 0)
    row.ratio = Number((100 - sumOthersRat).toFixed(2))
  } else {
    row.ratio = handleParseint((toNum(v) / cap) * 100, 2)
  }
  await nextTick()
  validateBudgetSplitField(index, 'ratio')
}

/** 失去焦点：本行比例 → 本行金额（与收付计划 PaymentPlanTable 一致） */
async function onBudgetSplitRatioBlur(row, index) {
  if (props.isDetail) return
  const v = row.ratio
  if (v === null || v === undefined || v === '') {
    row.amount = undefined
    await nextTick()
    validateBudgetSplitField(index, 'amount')
    return
  }
  const cap = contractTotalNum.value
  if (!cap) {
    row.amount = undefined
    await nextTick()
    validateBudgetSplitField(index, 'amount')
    return
  }
  const plans = props.formState.budgetSplits || []
  const ratioSum = plans.reduce((s, r) => s + toNum(r?.ratio), 0)
  const sumOthersAmt = plans.reduce((s, r) => (r === row ? s : s + toNum(r?.amount)), 0)
  if (ratioSumReachedFull(ratioSum) && !amountSumReachedFull(sumOthersAmt, cap)) {
    row.amount = Number((cap - sumOthersAmt).toFixed(2))
  } else {
    row.amount = handleParseint((cap * toNum(v)) / 100, 2)
  }
  await nextTick()
  validateBudgetSplitField(index, 'amount')
}

/** 与收付计划 `syncAmountsByContractTotalFromRatios` 一致：总价变化后逐行按比例算金额，截断两位小数 + 累计满 100% 行吃剩余金额 */
function syncBudgetAmountsByContractTotalFromRatios() {
  if (props.isDetail) return
  const cap = contractTotalNum.value
  let plans = props.formState.budgetSplits || []
  if (Number(props.formState.amountTaxIncluded || 0) > 0 && plans.length == 0) {
    plans = [{}]
    props.formState.budgetSplits = plans
  }
  let sum = 0
  let amount = 0
  for (let i = 0; i < plans.length; i++) {
    const row = plans[i]
    if (!row || typeof row !== 'object') continue
    const r = row.ratio
    if (r === null || r === undefined || r === '') {
      row.amount = undefined
      continue
    }
    const ratio = toNum(r)
    sum += ratio
    if (ratioSumReachedFull(sum) && !amountSumReachedFull(amount, cap)) {
      row.amount = Number((cap - amount).toFixed(2))
    } else {
      row.amount = handleParseint((cap * ratio) / 100, 2)
    }
    amount += Number(row.amount)
  }
}

const amountSumNum = computed(() =>
  (props.formState.budgetSplits || []).reduce((s, r) => s + toNum(r.amount), 0),
)

const contractAmountTaxIncludedDisplay = computed(() => {
  const v = props.formState.amountTaxIncluded
  if (v === null || v === undefined || v === '') return '-'
  const n = toNum(v)
  return fixed2(Math.round(n * 100) / 100)
})

const ratioSumDisplay = computed(() => {
  const sum = (props.formState.budgetSplits || []).reduce((s, r) => s + toNum(r.ratio), 0)
  return (Math.round(sum * 100) / 100).toFixed(2)
})

const createdDisplay = computed(() => fixed2(amountSumNum.value))
const uncreatedDisplay = computed(() => {
  const left = contractTotalNum.value - amountSumNum.value
  return fixed2(Math.max(0, left))
})

/** 未创建金额（数值），与 uncreatedDisplay 一致，供父组件校验 */
const amountUnallocatedNum = computed(() => {
  const left = contractTotalNum.value - amountSumNum.value
  return Math.max(0, Number(left.toFixed(2)))
})

function addRow() {
  props.formState.budgetSplits.push({})
}
function removeRow(index) {
  if (props.formState.budgetSplits.length === 1) {
    props.formState.budgetSplits = [{}]
    return
  }
  props.formState.budgetSplits.splice(index, 1)
}

defineExpose({
  syncBudgetAmountsByContractTotalFromRatios,
  amountUnallocatedNum,
})
</script>

<style lang="scss" scoped>
.payment-plan {
  background: #fafbff;
}
</style>
