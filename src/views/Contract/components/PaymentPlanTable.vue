<template>
  <div>
    <a-form-item v-if="!isDetail" class="mg-b-0" label="" name="planType"
      :rules="[{ required: !isDetail, message: '请选择付款或收款' }]">
      <a-radio-group v-model:value="formState.planType" :options="paymentTypeOptions" />
    </a-form-item>
    <div class="payment-plan flex align-center justify-center pd-y-small mg-t-small">
      <div style="margin:0 50px;" class="flex flex-column align-center justify-center">
        <div style="font-weight: 500;">{{ contractAmountTaxIncludedDisplay }}</div>
        <div style="margin-top: 4px;font-size: 12px;color: rgba(0,0,0,0.45);">合同总金额</div>
      </div>
      <div style="margin:0 50px;" class="flex flex-column align-center justify-center">
        <div style="font-weight: 500;">{{ ratioTotalDisplay }}</div>
        <div style="margin-top: 4px;font-size: 12px;color: rgba(0,0,0,0.45);">比例合计(%)</div>
      </div>
      <div style="margin:0 50px;" class="flex flex-column align-center justify-center">
        <div style="font-weight: 500;">{{ amountTotalDisplay }}</div>
        <div style="margin-top: 4px;font-size: 12px;color: rgba(0,0,0,0.45);">已创建金额</div>
      </div>
      <div style="margin:0 50px;" class="flex flex-column align-center justify-center">
        <div style="font-weight: 500;">{{ amountRemainingDisplay }}</div>
        <div style="margin-top: 4px;font-size: 12px;color: rgba(0,0,0,0.45);">未创建金额</div>
      </div>
    </div>
    <div v-if="!isDetail" class="mg-t-1">
      <a-button type="primary" size="small" @click="addRow">添加分期</a-button>
    </div>
    <a-table class="mg-t-1" :columns="columns" :data-source="formState.paymentPlans" :pagination="false"
      :scroll="{ x: 900 }">
      <template #headerCell="{ column }">

        <template v-if="column.key == 'node'">
          <span :class="isDetail ? '' : 'header-required-a'">
            {{
              formState.planType === '1' ? '付款节点' : formState.planType === '2' ? '收款节点' : '收付节点'
            }}
          </span>

        </template>
        <template v-if="['expectedDate', 'ratio', 'amount', 'companyId', 'counterpartyId'].includes(column.key)">
          <span :class="isDetail ? '' : 'header-required-a'">
            {{
              column.title
            }}
          </span>

        </template>

      </template>
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'seq'">{{ index + 1 }}</template>
        <template v-else-if="column.key === 'node'">
          <template v-if="isDetail">
            <span>{{ record.payReceiveNode }}</span>
          </template>
          <a-form-item v-else label="" :name="['paymentPlans', index, 'payReceiveNode']"
            :rules="[{ required: !isDetail, message: `请输入${formState.planType === '1' ? '付款' : formState.planType === '2' ? '收款' : '收付'}节点` }]">
            <a-input placeholder="请输入" v-model:value="record.payReceiveNode" />
          </a-form-item>
        </template>
        <template v-else-if="column.key === 'expectedDate'">
          <template v-if="isDetail">
            <span>{{ record.expectedDate }}</span>
          </template>
          <a-form-item v-else label="" :name="['paymentPlans', index, 'expectedDate']"
            :rules="[{ required: !isDetail, message: '请选择预计日期' }]">
            <a-date-picker v-model:value="record.expectedDate" value-format="YYYY-MM-DD" placeholder="请选择" />
          </a-form-item>
        </template>
        <template v-else-if="column.key === 'ratio'">
          <template v-if="isDetail">
            <span>{{toFixedNumberString(record.ratio) }}</span>
          </template>
          <a-form-item v-else label="" :name="['paymentPlans', index, 'ratio']"
            :rules="[{ required: !isDetail, message: '请输入比例' }]">
            <a-input-number v-model:value="record.ratio" placeholder="请输入" :controls="false" :precision="2" :min="0"
              :max="maxRatioForRow(index)" @blur="() => onPaymentPlanRatioBlur(record, index)" />
          </a-form-item>
        </template>
        <template v-else-if="column.key === 'amount'">
          <template v-if="isDetail">
            <span>{{ toFixedNumberString(record.amount) }}</span>
          </template>
          <a-form-item v-else label="" :name="['paymentPlans', index, 'amount']"
            :rules="[{ required: !isDetail, message: '请输入金额' }]">
            <a-input-number v-model:value="record.amount" :controls="false" placeholder="请输入" :min="0" :precision="2"
              :max="maxAmountForRow(index)" @blur="() => onPaymentPlanAmountBlur(record, index)" />
          </a-form-item>
        </template>
        <template v-else-if="column.key === 'companyId'">
          <template v-if="isDetail">
            <span>{{ record.companyName }}</span>
          </template>
          <a-form-item v-else label="" :name="['paymentPlans', index, 'companyId']"
            :rules="[{ required: !isDetail, message: '请选择我方主体' }]">
            <a-select showSearch option-filter-prop="label" v-model:value="record.companyId"
              :options="participantOurCompanyOptions" placeholder="请选择" allow-clear
              @change="(val) => onCompanyChange(record, val)" />
          </a-form-item>
        </template>
        <template v-else-if="column.key === 'counterpartyId'">
          <template v-if="isDetail">
            <span>{{ record.counterpartyName }}</span>
          </template>
          <a-form-item v-else label="" :name="['paymentPlans', index, 'counterpartyId']"
            :rules="[{ required: !isDetail, message: '请选择对方客商' }]">
            <a-select option-filter-prop="label" showSearch v-model:value="record.counterpartyId"
              :options="participantPartnerOptions" placeholder="请选择" allow-clear
              @change="(val) => onCounterpartyChange(record, val)" />
          </a-form-item>
        </template>
        <template v-else-if="column.key === 'remark'">
          <template v-if="isDetail">
            <span>{{ record.remark || '-' }}</span>
          </template>
          <a-form-item v-else label="" :name="['paymentPlans', index, 'remark']">
            <a-input v-model:value="record.remark" placeholder="请输入" />
          </a-form-item>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button v-if="!isDetail" type="link" @click="removeRow(index)">删除</a-button>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup>
import { computed, nextTick, unref } from 'vue'
import { handleParseint, toFixedNumberString } from '@/utils/com.js'
import { intentionPlanTypeRadioOptions } from './intentionEditFieldSchema.js'
defineOptions({ name: 'PaymentPlanTable' })

const paymentTypeOptions = intentionPlanTypeRadioOptions

const props = defineProps({
  formState: { type: Object, required: true },
  isDetail: { type: Boolean, default: false },
  /** 外层 a-form 的 ref，用于金额/比例联动校验 */
  formRef: { type: Object, default: null },
  supplierOptionsWithAll: { type: Object, default: () => ({}) },
  subjectOptionsWithAll: { type: [Array, Object], default: () => [] },
})

const toNum = (v) => Number(String(v ?? 0).replace(/,/g, '')) || 0

/** 收付计划「我方主体」：仅参与方表格中 role 为我方且已选主体的项 */
const participantOurCompanyOptions = computed(() => {
  let _row = Array.isArray(props.formState.participantRows) ? props.formState.participantRows : []
  _row = _row.filter(e => e.role === 'our')
  let arr = props.subjectOptionsWithAll?.arr?.filter(e => _row.some(r => r.id === e.id)) || []
  return arr.map(e => ({
    label: e.companyName,
    value: e.id,
  }))
})

/** 收付计划「对方客商」：仅参与方表格中 role 为对方且已选主体的项 */
const participantPartnerOptions = computed(() => {
  let _row = Array.isArray(props.formState.participantRows) ? props.formState.participantRows : []
  _row = _row.filter(e => e.role === 'partner')
  let arr = props.supplierOptionsWithAll?.arr?.filter(e => _row.some(r => r.id === e.id)) || []
  return arr.map(e => ({
    label: e.name,
    value: e.id,
  }))
})

const columns = [
  { title: '期数', key: 'seq', width: 60 },
  { title: '收付节点', key: 'node', width: 130 },
  { title: '预计日期', key: 'expectedDate', width: 170 },
  { title: '比例', key: 'ratio', width: 100 },
  { title: '金额(元)', key: 'amount', width: 130 },
  { title: '我方主体', key: 'companyId', width: 130 },
  { title: '对方客商', key: 'counterpartyId', width: 130 },
  { title: '备注', key: 'remark', width: 200 },

]
if (!props.isDetail) {
  columns.push({ title: '操作', key: 'action', width: 50, fixed: 'right' })
}

function onCompanyChange(record, id) {
  record.companyName = id
    ? participantOurCompanyOptions.value.find((o) => o.value === id)?.label
    : undefined
}

function onCounterpartyChange(record, id) {
  record.counterpartyName = id
    ? participantPartnerOptions.value.find((o) => o.value === id)?.label
    : undefined
}

/** 参与方「我方 / 对方」参与主体变更时由父组件触发（替代对 options 的 watch） */
function syncPaymentPlansFromParticipants() {
  if (props.isDetail) return
  const ours = participantOurCompanyOptions.value
  const partners = participantPartnerOptions.value
  if (ours.length === 1 && partners.length === 1) {
    let arr = props.formState.paymentPlans.filter((e) => e.companyId == null || e.counterpartyId == null)
    if (arr.length <= 1) {
      props.formState.paymentPlans = [{
        companyId: ours[0].value,
        counterpartyId: partners[0].value,
        companyName: ours[0].label,
        counterpartyName: partners[0].label,
      }]
    }
  } else {
    props.formState.paymentPlans = [{
      companyId: undefined,
      counterpartyId: undefined,
      companyName: undefined,
      counterpartyName: undefined,
    }]
  }
}
const fixed2 = (n) => n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const contractTotalNum = computed(() => Math.max(0, toNum(props.formState.amountTaxIncluded)))

/** 除本行外，各表行已填比例之和（空/非数字按 0） */
function sumRatioExcludingIndex(plans, index) {
  const list = plans || []
  return list.reduce((s, r, i) => (i !== index ? s + toNum(r.ratio) : s), 0)
}

/** 本行金额上限：合同总额（分）− 其它行已填金额；比例上限由 maxRatioForRow 约束，失焦时吃尾差对齐 */
function maxAmountForRow(index) {
  const cap = contractTotalNum.value
  if (!cap) return 0
  const plans = props.formState.paymentPlans || []
  const capCents = Math.round(cap * 100)
  const othersCents = plans.reduce(
    (s, r, i) => (i !== index ? s + Math.round(toNum(r.amount) * 100) : s),
    0,
  )
  return Math.max(0, Number(((capCents - othersCents) / 100).toFixed(2)))
}

/** 本行比例上限：全表比例合计不超 100%（金额上限由 maxAmountForRow 约束，失焦时吃尾差对齐） */
function maxRatioForRow(index) {
  const plans = props.formState.paymentPlans || []
  const sumOthers = sumRatioExcludingIndex(plans, index)
  return Math.min(100, Math.max(0, Math.round((100 - sumOthers) * 100) / 100))
}

/** 累计比例达到 100%（按百分数两位小数）时视为收尾行，用于吃尾差（仅合同总额变化时全表重算用） */
function ratioSumReachedFull(sumRatio) {
  return Math.round(sumRatio * 100) >= 10000
}

/** 各行金额合计达到合同总额（按分）时视为满额，用于比例吃尾差 */
function amountSumReachedFull(sumAmtYuan, capYuan) {
  return Math.round(sumAmtYuan * 100) >= Math.round(capYuan * 100)
}

function validatePaymentPlanField(index, field) {
  if (props.isDetail || index == null || index < 0) return
  const form = unref(props.formRef)
  form?.validateFields([['paymentPlans', index, field]]).catch(() => { })
}

/** 失去焦点：本行金额 → 本行比例（全表金额合计满合同总额时本行比例 = 100% − 其余行比例之和） */
async function onPaymentPlanAmountBlur(row, index) {
  if (props.isDetail) return
  const v = row.amount
  if (v === null || v === undefined || v === '') {
    row.ratio = undefined
    await nextTick()
    validatePaymentPlanField(index, 'ratio')
    return
  }
  const cap = contractTotalNum.value
  if (!cap) {
    row.ratio = undefined
    await nextTick()
    validatePaymentPlanField(index, 'ratio')
    return
  }
  const plans = props.formState.paymentPlans || []
  const amountSum = plans.reduce((s, r) => s + toNum(r?.amount), 0)
  const ratioSum = plans.reduce((s, r) => s + toNum(r?.ratio), 0)
  if (amountSumReachedFull(amountSum, cap) && !ratioSumReachedFull(ratioSum)) {
    const sumOthersRat = plans.reduce((s, r) => (r === row ? s : s + toNum(r?.ratio)), 0)
    row.ratio = Number((100 - sumOthersRat).toFixed(2))
  } else {
    row.ratio = handleParseint((toNum(v) / cap) * 100, 2)
  }
  await nextTick()
  validatePaymentPlanField(index, 'ratio')
}

/** 失去焦点：本行比例 → 本行金额（全表比例合计满 100% 时本行吃剩余金额） */
async function onPaymentPlanRatioBlur(row, index) {
  if (props.isDetail) return
  const v = row.ratio
  if (v === null || v === undefined || v === '') {
    row.amount = undefined
    await nextTick()
    validatePaymentPlanField(index, 'amount')
    return
  }
  const cap = contractTotalNum.value
  if (!cap) {
    row.amount = undefined
    await nextTick()
    validatePaymentPlanField(index, 'amount')
    return
  }
  const plans = props.formState.paymentPlans || []
  const ratioSum = plans.reduce((s, r) => s + toNum(r?.ratio), 0)
  const sumOthersAmt = plans.reduce((s, r) => (r === row ? s : s + toNum(r?.amount)), 0)
  if (ratioSumReachedFull(ratioSum) && !amountSumReachedFull(sumOthersAmt, cap)) {
    row.amount = Number((cap - sumOthersAmt).toFixed(2))
  } else {
    row.amount = handleParseint((cap * toNum(v)) / 100, 2)
  }
  await nextTick()
  validatePaymentPlanField(index, 'amount')
}

/** 合同总金额(含税)变化后：逐行按比例算金额；无比例则金额为空；金额按元截断两位小数（不四舍五入） */
function syncAmountsByContractTotalFromRatios() {
  if (props.isDetail) return
  const cap = contractTotalNum.value
  let plans = props.formState.paymentPlans || []
  if (Number(props.formState.amountTaxIncluded || 0) > 0 && plans.length == 0) {
    plans = [{}]
    props.formState.paymentPlans = plans
    syncPaymentPlansFromParticipants()
    return
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
  (props.formState.paymentPlans || []).reduce((s, r) => s + toNum(r.amount), 0),
)

const amountTotalDisplay = computed(() => fixed2(amountSumNum.value))
const amountRemainingDisplay = computed(() => {
  const left = contractTotalNum.value - amountSumNum.value
  return fixed2(Math.max(0, left))
})

/** 未创建金额（数值），与 amountRemainingDisplay 一致，供父组件校验 */
const amountUnallocatedNum = computed(() => {
  const left = contractTotalNum.value - amountSumNum.value
  return Math.max(0, Number(left.toFixed(2)))
})

/** 顶部「合同总金额」展示：保留两位小数（与已创建/未创建金额格式一致） */
const contractAmountTaxIncludedDisplay = computed(() => {
  const v = props.formState.amountTaxIncluded
  if (v === null || v === undefined || v === '') return '-'
  const n = toNum(v)
  return fixed2(Math.round(n * 100) / 100)
})

const ratioTotalDisplay = computed(() => {
  const sum = (props.formState.paymentPlans || []).reduce((s, r) => s + toNum(r.ratio), 0)
  return (Math.round(sum * 100) / 100).toFixed(2)
})

function addRow() {
  props.formState.paymentPlans.push({})
}
function removeRow(index) {
  if (props.formState.paymentPlans.length == 1) {
    props.formState.paymentPlans = [{}]
    return
  }
  props.formState.paymentPlans.splice(index, 1)
}

defineExpose({
  syncPaymentPlansFromParticipants,
  syncAmountsByContractTotalFromRatios,
  amountUnallocatedNum,
})
</script>

<style lang="scss" scoped>
.payment-plan {
  background: #FAFBFF;
}
</style>
