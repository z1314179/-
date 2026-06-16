<template>
  <a-modal :open="open" title="一键分摊" width="520px" :mask-closable="false" destroy-on-close @cancel="handleCancel">
    <a-form ref="formRef" layout="horizontal" :model="form" :rules="rules" autocomplete="off"
      :label-col="{ style: { width: '80px' } }">
      <a-form-item label="预算期间" name="dateRange" :rules="[{ required: true, message: '请选择预算期间', trigger: 'change' }]">
        <a-range-picker v-model:value="form.dateRange" format="YYYY-MM" picker="month" value-format="YYYY-MM"
          :placeholder="['开始日期', '结束日期']" />
      </a-form-item>
      <a-form-item label="分摊金额" name="amount">
        <a-input-number v-model:value="form.amount" placeholder="请输入" :controls="false" :precision="2" :min="0"
          :max="formState.amountTaxIncluded">
          <template #addonAfter>
            <a-select disabled :value="formState.currency" :options="currencyOptions" style="width: 80px" />
          </template></a-input-number>
      </a-form-item>
      <a-form-item label="费用类型" name="expenseType" :rules="[{ required: true, message: '请选择费用类型', trigger: 'change' }]">
        <a-select placeholder="请选择" show-search option-filter-prop="value" v-model:value="form.expenseType"
          :options="expenseTypeSelectOptions" :field-names="{ label: 'value', value: 'key' }" style="width: 260px" />
      </a-form-item>
      <a-form-item label="分摊周期" name="period" :rules="[{ required: true, message: '请选择分摊周期', trigger: 'change' }]">
        <a-select v-model:value="form.period" :options="periodOptions" placeholder="请选择" style="width: 260px" />
      </a-form-item>
    </a-form>
    <template #footer>
      <a-button @click="handleCancel">取消</a-button>
      <a-button type="primary" class="mg-l-1" @click="handleSave">
        保存
      </a-button>
    </template>
  </a-modal>
</template>

<script setup>
defineOptions({ name: 'BudgetOneClickSplitModal' })
import { computed, nextTick, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { currencyFn } from '@/utils/codeMap/basic.js'

const { currencyList: currencyOptions } = currencyFn()

const props = defineProps({
  formState: { type: Object, required: true },
  open: { type: Boolean, default: false },
  expenseTypeOptionsWithAll: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['update:open', 'save'])

const formRef = ref(null)

const form = ref({
})
watch(() => props.open, (newVal) => {
  if (newVal) {
    form.value = {
      dateRange: props.formState.contractDateRange ? [dayjs(props.formState.contractDateRange[0]).startOf('month').format('YYYY-MM'), dayjs(props.formState.contractDateRange[1]).endOf('month').format('YYYY-MM')] : [],
      amount: undefined,
      expenseType: undefined,
      period: undefined,
    }
    nextTick(() => {
      formRef.value?.clearValidate?.()
    })
  }
})
const expenseTypeSelectOptions = computed(
  () => (Array.isArray(props.expenseTypeOptionsWithAll?.arr) ? props.expenseTypeOptionsWithAll.arr : []),
)

const periodOptions = [
  { label: '月', value: 1 },
  { label: '季度', value: 3 },
  { label: '半年度', value: 6 },
  { label: '年度', value: 12 },
]
const rules = {
  amount: [
    { required: true, message: '请输入分摊金额', trigger: 'blur' },
    {
      type: 'number',
      min: 0.01,
      message: '金额必须大于 0',
      trigger: 'blur',
      transform: (v) => (v === null || v === undefined || v === '' ? v : Number(v)),
    },
  ],
  expenseType: [{ required: true, message: '请选择费用类型', trigger: 'change' }],
  period: [{ required: true, message: '请选择分摊周期', trigger: 'change' }],
}



function handleCancel() {
  emit('update:open', false)
  form.value = {}
}
/** 总月数 val 按周期 period（月）拆分：整除部分每档 period 个月，余数单独一档；返回各档月数，如 [3,3,3,1] */
function splitMonthsIntoPeriodBuckets(val, period) {
  const v = Math.floor(Number(val) || 0)
  const p = Math.max(1, Math.floor(Number(period) || 1))
  if (v <= 0) return []
  const fullCount = Math.floor(v / p)
  const rem = v % p
  const arr = []
  for (let i = 0; i < fullCount; i++) arr.push(p)
  if (rem > 0) arr.push(rem)
  return arr
}

async function handleSave() {
  await formRef.value?.validate()
  const query = { ...form.value }
  const [rangeStart, rangeEnd] = query.dateRange || []
  const startMonth = dayjs(rangeStart, 'YYYY-MM')
  const endMonth = dayjs(rangeEnd, 'YYYY-MM')
  const val = startMonth.isValid() && endMonth.isValid() && !endMonth.isBefore(startMonth)
    ? endMonth.diff(startMonth, 'month') + 1
    : 0
  if (!val) {
    message.warning('预算期间无法计算月数，请检查起止日期')
    return
  }
  const period = Number(query.period) || 1
  query.monthSpans = splitMonthsIntoPeriodBuckets(val, period)
  const spans = query.monthSpans
  if (!spans.length) {
    message.warning('分档月数无效')
    return
  }
  const splitCap = Math.max(0, Number(query.amount) || 0)
  /** 按各档月数占比分摊到「分」，前几档向下取整、最后一档吃剩余，避免月均截断再乘月导致各档不等（如四季本应各 25%） */
  const splitCapCents = Math.round(splitCap * 100)
  const totalSpanMonths = spans.reduce((s, m) => s + (Number(m) || 0), 0)
  let sumCentsAllocated = 0
  let sumRatio = 0
  const lastIdx = spans.length - 1
  const totalAmt = Number(props.formState.amountTaxIncluded) || 0
  const targetRatioPct = totalAmt > 0 ? Number(((splitCap / totalAmt) * 100).toFixed(2)) : 0
  const [startDate] = query.dateRange || []
  let monthAcc = 0
  const arr = spans.map((e, i) => {
    const months = Number(e) || 0
    let rowCents
    if (i === lastIdx) {
      rowCents = splitCapCents - sumCentsAllocated
    } else {
      rowCents = Math.floor((splitCapCents * months) / totalSpanMonths)
    }
    sumCentsAllocated += rowCents
    const monthAmt = Number((rowCents / 100).toFixed(2))
    let ratio = 0
    if (i === lastIdx) {
      ratio = monthAmt > 0 && totalAmt > 0
        ? Number(Math.max(0, targetRatioPct - sumRatio).toFixed(2))
        : 0
    } else if (monthAmt > 0 && totalAmt > 0 && sumRatio < targetRatioPct) {
      ratio = Number(((monthAmt / totalAmt) * 100).toFixed(2))
      if (ratio + sumRatio >= targetRatioPct) {
        ratio = Number(Math.max(0, targetRatioPct - sumRatio).toFixed(2))
      }
    }
    sumRatio += ratio
    const budgetDate = dayjs(startDate).add(monthAcc, 'month').format('YYYY-MM')
    monthAcc += months
    return { amount: monthAmt, ratio, expenseType: query.expenseType, budgetDate }
  })

  emit('save', arr)
  handleCancel()
}
</script>
