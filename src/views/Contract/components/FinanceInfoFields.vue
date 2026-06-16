<template>
  <template v-for="(entry, idx) in financeRows" :key="entry.name + '-' + idx">
    <a-form-item :label="entry.label" :name="entry.name" :rules="entry.rules">
      <template v-if="isDetail">
        <span v-if="entry.fieldType === 'amountTaxIncluded'">{{ toFixedNumberString(formState.amountTaxIncluded)
        }}</span>
        <span v-else-if="entry.fieldType === 'select'">{{ formatSelectDetailLabel(entry) }}</span>
        <span v-else-if="entry.fieldType === 'computed' && entry.computedKey === 'computedTaxAmount'">{{
          toFixedNumberString(formState.taxAmount) }}</span>
        <span v-else-if="entry.fieldType === 'computed' && entry.computedKey === 'computedAmountTaxExcluded'">{{
          toFixedNumberString(formState.amountTaxExcluded) }}</span>
        <span v-else-if="entry.fieldType === 'input'">{{ formState.invoiceTitle || '-' }}</span>
      </template>
      <template v-else>
        <a-input-number v-if="entry.fieldType === 'amountTaxIncluded'" v-model:value="formState.amountTaxIncluded"
          :controls="false" placeholder="请输入合同金额(含税)" :min="0" :precision="2" :max="999999999"
          @change="onAmountTaxIncludedChange">
          <template #addonAfter>
            <a-select style="width: 80px !important" v-model:value="formState.currency" :options="currencyOptions" />
          </template>
        </a-input-number>
        <a-select v-else-if="entry.fieldType === 'select'" v-model:value="formState[entry.name]"
          :options="entry.options || []" allow-clear :placeholder="entry.placeholder"
          @change="(val) => onSelectChange(entry.name, val)" />
        <a-input v-else-if="entry.fieldType === 'input'" v-model:value="formState[entry.name]" allow-clear
          :placeholder="entry.placeholder" />
        <a-input v-else-if="entry.fieldType === 'computed'" :value="financeComputedDisplay(entry)" disabled />
      </template>
    </a-form-item>
  </template>
</template>

<script setup>
defineOptions({ name: 'FinanceInfoFields' })
import { computed, watch } from 'vue'
import { currencyFn } from '@/utils/codeMap/basic.js'
import { financeFormFieldSequence } from './intentionEditFieldSchema.js'
import { toFixedNumberString } from '@/utils/com.js'
const { currencyList: currencyOptions } = currencyFn()

const props = defineProps({
  formState: { type: Object, required: true },
  isDetail: { type: Boolean, default: false },
})
const emit = defineEmits(['change'])

const financeRows = computed(() => {
  const amount = Number(props.formState.amountTaxIncluded) || 0
  return financeFormFieldSequence
    .filter((row) => row.name !== 'paymentCondition' || amount > 0)
    .map((row) => {
    const rawRules = typeof row.rules === 'function' ? row.rules(props.formState) : (row.rules || [])
    return {
      ...row,
      rules: rawRules.map((r) => ({
        ...r,
        required: props.isDetail ? false : !!r.required,
      })),
    }
  })
})

function formatSelectDetailLabel(entry) {
  const v = props.formState[entry.name] 
  if (v === null || v === undefined || v === '') return '-'
  const opt = (entry.options || []).find((o) => o.value === v || String(o.value) === String(v))
  return opt?.label ?? String(v)
}

function financeComputedDisplay(entry) {
  if (entry.computedKey === 'computedTaxAmount') return computedTaxAmount.value
  if (entry.computedKey === 'computedAmountTaxExcluded') return computedAmountTaxExcluded.value
  return ''
}

function onAmountTaxIncludedChange() {
  if (props.isDetail) return
  emit('change')
}

function onSelectChange(name, val) {
  if (props.isDetail) return
  if (name === 'isBudgetOccupied') {
    emit('change', { name: 'isBudgetOccupied', value: val })
  }
}

function toFiniteNumber(v) {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/** 税率统一为小数：选项/接口为 0.06；历史数据可能为 6、9、13 */
function toTaxRateDecimal(rate) {
  const n = toFiniteNumber(rate)
  if (n == null || n < 0) return null
  return n > 1 ? n / 100 : n
}

const computedTaxAmount = computed(() => {
  const total = toFiniteNumber(props.formState.amountTaxIncluded)
  const rate = toTaxRateDecimal(props.formState.taxRate ?? props.formState.financeTaxRate)
  if (total == null || total < 0 || rate == null) return '-'
  const excluded = total / (1 + rate)
  return (total - excluded).toFixed(2)
})

const computedAmountTaxExcluded = computed(() => {
  const total = toFiniteNumber(props.formState.amountTaxIncluded)
  const rate = toTaxRateDecimal(props.formState.taxRate ?? props.formState.financeTaxRate)
  if (total == null || total < 0 || rate == null) return '-'
  return (total / (1 + rate)).toFixed(2)
})

watch(
  computedTaxAmount,
  (v) => {
    props.formState.taxAmount = v
  },
  { immediate: true },
)

watch(
  computedAmountTaxExcluded,
  (v) => {
    props.formState.amountTaxExcluded = v
  },
  { immediate: true },
)
</script>
