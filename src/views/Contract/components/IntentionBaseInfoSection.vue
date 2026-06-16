<template>
  <template v-for="(entry, idx) in intentionBaseFormFieldSequence" :key="baseFieldRowKey(entry, idx)">
    <a-form-item v-if="entry.rowType === 'field' && baseFieldVisible(entry)" :label="entry.label" :name="entry.name"
      :rules="entry.rules">
      <a-input :disabled="disabledKeys.includes(entry.label)" v-if="entry.fieldType === 'input'"
        v-model:value="formState[entry.name]" :placeholder="entry.placeholder" allow-clear style="width: 100%" />
      <a-select v-else-if="entry.fieldType === 'select'" :disabled="disabledKeys.includes(entry.label)"
        v-model:value="formState[entry.name]" :placeholder="entry.placeholder" allow-clear style="width: 100%"
        @change="(val) => onBaseFieldSelectChange(entry, val)">
        <a-select-option v-for="opt in baseFieldSelectOptions(entry)" :key="selectOptionValue(opt, entry)"
          :value="selectOptionValue(opt, entry)" :label="selectOptionLabel(opt, entry)"
          :class="{ 'base-select-option--hide': opt.hide }">
          {{ selectOptionLabel(opt, entry) }}
        </a-select-option>
      </a-select>
      <!-- <cascaderCheck :disabled="disabledKeys.includes(entry.label)" v-else-if="entry.fieldType === 'cascader'"
        style="width: 100%" v-model:value="formState[entry.name]" :options="deptListOptions"
        :field-names="deptFieldNames" show-search tree-node-filter-prop="name" tree-default-expand-all
        tree-data-simple-mode :placeholder="entry.placeholder" allow-clear
        @change="(val) => onHandlerDeptChange(val)" /> -->
      <a-range-picker :disabled="disabledKeys.includes(entry.label)" v-else-if="entry.fieldType === 'rangePicker'"
        v-model:value="formState.contractDateRange" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width: 100%"
        :placeholder="['开始日期', '结束日期']" />
      <a-date-picker :disabled="disabledKeys.includes(entry.label)" v-else-if="entry.fieldType === 'datePicker'"
        v-model:value="formState[entry.name]" format="YYYY-MM-DD" value-format="YYYY-MM-DD"
        :placeholder="entry.placeholder" />

      <a-input :disabled="true" v-else-if="entry.fieldType === 'computed'" :value="baseComputedDisplay(entry)" disabled
        :placeholder="entry.placeholder || '-'" allow-clear style="width: 100%" />
    </a-form-item>
  </template>
  <div style="width: 100%;">
    <a-form-item name="participantRows" style="width: 100%;" label="设置参与方" :autoLink="false"
      :rules="[{ required: true, message: '', trigger: 'change' }]">
      <div class="party-table-wrapper">
        <a-table :scroll="{ x: 980 }" :columns="partyColumns" :data-source="formState.participantRows" row-key="id"
          :pagination="false" size="small" class="intention-base-info__party-table">
          <template #headerCell="{ column }">
            <template v-if="column.key === 'id'">
              <span class="header-required-a">
                {{ column.title }}
              </span>
            </template>
          </template>
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'party'">
              {{ record.role === 'our' ? '我方' : '对方客商' }}
            </template>
            <template v-else-if="column.key === 'id'">
              <a-form-item v-if="record.role === 'our'" :name="['participantRows', index, 'id']"
                :rules="[{ required: true, message: '', trigger: 'change' }]">
                <a-select :disabled="disabledKeys.includes('参与主体')" v-model:value="record.id" placeholder="请选择参与主体"
                  allow-clear @change="(val) => onOurPrincipalChange(record, val)">
                  <a-select-option v-for="opt in ourSubjectOptionList" :key="opt.id" :value="opt.id"
                    :disabled="isOurSubjectOptionDisabled(opt, record)">
                    {{ opt.companyName }}
                  </a-select-option>
                </a-select>
              </a-form-item>
              <a-form-item v-else :name="['participantRows', index, 'id']"
                :rules="[{ required: true, message: '', trigger: 'change' }]">
                <a-select :disabled="disabledKeys.includes('参与主体')" v-model:value="record.id"
                  :placeholder="record.role === 'our' ? '请选择我方主体' : '请选择对方客商'" allow-clear
                  @change="(val) => onPartnerPrincipalChange(record, val)">
                  <a-select-option v-for="opt in partnerSupplierOptionList" :key="opt.id" :value="opt.id"
                    :disabled="isPartnerSupplierOptionDisabled(opt, record)">
                    {{ opt.name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </template>
            <template v-else-if="column.key === 'bank'">
              <span v-if="record.role === 'our'">/</span>
              <div v-else class="flex align-center">
                <span class="party-bank-cell__text text-ellipsis">{{ handleBankInfo(record) || '-' }}</span>
                <i v-if="record.id" class="mg-l-small iconfont icon-bianji cpr p-color"
                  @click.stop="openBankAccountModal(record)" />
              </div>
            </template>
            <template v-else-if="column.key === 'action'">
              <a-space>
                <a-button type="link" v-if="record.role === 'partner'" :disabled="!record.bankInfo?.id"
                  @click.prevent="openPartnerModal(record)">客商信息</a-button>
                <a-button type="link" :disabled="canRemoveParty(record)" @click="removeParty(index)">删除</a-button>
              </a-space>
            </template>
          </template>
        </a-table>
        <div class="party-actions" v-if="!disabledKeys.includes('参与主体')">
          <a-button class="mg-r-small" type="primary" ghost size="small" @click="addOur">
            <template #icon>
              <PlusOutlined />
            </template>
            添加我方主体</a-button>
          <a-button type="primary" ghost size="small" @click="addPartner">
            <template #icon>
              <PlusOutlined />
            </template>
            添加对方客商</a-button>
        </div>
      </div>

    </a-form-item>
  </div>
  <div style="width: 100%;">
    <a-form-item label="备注" style="width: 100%" name="remark" class="mg-b-0">
      <a-textarea @change="onRemarkChange" v-model:value="formState.remark" :auto-size="{ minRows: 1 }"
        placeholder="请输入" />
    </a-form-item>
  </div>

  <PartnerInfoModal v-model:open="partnerModalVisible" :bankPickerRows="[bankPickerRow]" />

  <SelectBankAccountModal v-model:openState="bankPickerOpen" :accounts="bankPickerAccounts"
    :selected-id="bankPickerRow.bankInfo?.id" @confirm="onBankAccountConfirm" />

</template>

<script setup>
defineOptions({ name: 'IntentionBaseInfoSection' })
import { computed, ref, unref, watch } from 'vue'
import { message } from 'ant-design-vue'
import PartnerInfoModal from './modals/PartnerInfoModal.vue'
import SelectBankAccountModal from './modals/SelectBankAccountModal.vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { getDateRangeApproxMonths } from '@/utils/com.js'
import { intentionBaseFormFieldSequence } from './intentionEditFieldSchema.js'
import cascaderCheck from '@/components/system/cascaderCheck.vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const deptFieldNames = { label: 'name', value: 'id', children: 'children' }
const onRemarkChange = (value) => {

}
const disabledKeys = computed(() => {
  let arr = []
  if (route.query.type === 'change' || route.query.type === 'renew') {
    arr.push('合同分类')
    arr.push('合同属性')
    arr.push('品牌')
    arr.push('参与主体')
  }
  return arr
})
const props = defineProps({
  formState: { type: Object, required: true },
  formValues: { type: Object, required: true },
  categoryOptionsWithAll: { type: Object, required: true },
  contractPropertyOptionsWithAll: { type: Object, required: true },
  brandOptionsWithAll: { type: Object, required: true },
  supplierOptionsWithAll: { type: Object, required: true },
  subjectOptionsWithAll: { type: Object, required: true },
  userOptionsWithAll: { type: Object, default: () => ({ arr: [], obj: {} }) },
  deptListOptions: { type: Array, default: () => [] },
  deptListMap: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['change'])

function baseFieldRowKey(entry, idx) {
  return `${entry.name}-${entry.label}-${idx}`
}

function baseFieldVisible(entry) {
  if (entry.name !== 'changeEffectiveDate') return true
  return route.query.type === 'change'
}

function baseFieldSelectOptions(entry) {
  if (entry.optionsFrom === 'category') return props.categoryOptionsWithAll.arr
  if (entry.optionsFrom === 'contractProperty') return props.contractPropertyOptionsWithAll.arr
  if (entry.optionsFrom === 'brand') return props.brandOptionsWithAll.arr
  if (entry.optionsFrom === 'user') {
    let arr = props.userOptionsWithAll?.arr ?? []
    return arr.filter(item => item.status === 1)
  }
  if (entry.optionsFrom === 'dept') return props.deptListOptions ?? []
  if (Array.isArray(entry.options) && entry.options.length > 0) return entry.options
  return []
}

function selectOptionLabel(opt, entry) {
  const key = entry.selectFieldNames?.label ?? 'label'
  return opt[key]
}

function selectOptionValue(opt, entry) {
  const key = entry.selectFieldNames?.value ?? 'value'
  return opt[key]
}

function onBaseFieldSelectChange(entry, val) {
  if (entry.optionsFrom === 'user') onHandlerUserChange(val)
  if (entry.optionsFrom === 'dept') onHandlerDeptChange(val)
}

function onHandlerUserChange(userId) {
  props.formState.handlerUserName = userId != null && userId !== ''
    ? props.userOptionsWithAll?.obj?.[userId]?.userName
    : undefined
}

function onHandlerDeptChange(deptId) {
  props.formState.handlerDeptName = deptId != null && deptId !== ''
    ? props.deptListMap?.[deptId]?.name
    : undefined
}

function baseComputedDisplay(entry) {
  if (entry.fieldType === 'computed' && entry.computedKey === 'computedContractMonths') {
    return computedContractMonths.value
  }
  return ''
}

const computedContractMonths = computed(() =>
  getDateRangeApproxMonths(props.formState.contractDateRange),
)

watch(
  computedContractMonths,
  (v) => {
    props.formState.contractMonths = v
  },
  { immediate: true },
)

const handleBankInfo = (record) => {
  const { bankInfo } = record
  if (!bankInfo?.id) return ''
  let str = bankInfo.accountOpen || ''
  str += bankInfo.accountOpenBranch || ''
  str += '；'
  str += (record.bankInfo.accountNumber || '') + ''
  return str
}


const baseSelectOptions = {
  contractCategory: [
    { label: '销售合同', value: 'sales' },
    { label: '采购合同', value: 'purchase' },
    { label: '服务合同', value: 'service' },
  ],
  subject: [
    { label: '上海丽知品牌有限责任公司', value: 'sh-lz' },
    { label: '杭州丽知品牌有限责任公司', value: 'hz-lz' },
  ],
  brand: [
    { label: 'INTOYOU', value: 'INTOYOU' },
    { label: 'LZ BEAUTY', value: 'LZ_BEAUTY' },
  ],
  contractProperty: [
    { label: '普通合同', value: 'normal' },
    { label: '框架合同', value: 'frame' },
  ],
  partner: [
    { label: '上海科技股份有限公司', value: 'sh-tech' },
    { label: '杭州优优传媒有限公司', value: 'hz-media' },
  ],
}

const partnerBankAccountsByPartner = {
  'sh-tech': [
    {
      id: 'sh-tech-bank-1',
      title: '基本账户',
      tag: '默认',
      tagColor: 'success',
      bankName: '中国工商银行',
      branchName: '中国工商银行上海浦东分行',
      accountNoMasked: '6222********1234',
      accountName: '上海科技创新有限公司',
      default: true,
    },
  ],
  'hz-media': [
    {
      id: 'hz-media-bank-1',
      title: '基本账户',
      tag: '默认',
      tagColor: 'success',
      bankName: '招商银行',
      branchName: '招商银行杭州高新支行',
      accountNoMasked: '6214********9012',
      accountName: '杭州优优传媒有限公司',
      default: true,
    },
  ],
}

const partnerModalVisible = ref(false)
const modalPartnerPrincipal = ref('')

const partnerModalTabList = computed(() => {
  const pk = modalPartnerPrincipal.value
  if (!pk) return []
  const label = baseSelectOptions.partner.find((o) => o.value === pk)?.label || pk
  return [
    {
      key: pk,
      label,
      taxNo: '',
      legalPerson: '',
      registerAddress: '',
      companyPhone: '',
      cooperationContent: '',
      accountName: label,
      bankName: '',
      branchName: '',
      bankAccountNo: '',
      contactPerson: '',
      contactPhone: '',
      email: '',
      contactAddress: '',
      historyList: [],
    },
  ]
})



const bankPickerOpen = ref(false)
const bankPickerRow = ref({})
function openPartnerModal(record) {
  if (record.role !== 'partner') return
  if (!record.id) {
    message.warning('请先选择参与主体')
    return
  }
  bankPickerRow.value = record
  partnerModalVisible.value = true
}
const bankPickerAccounts = computed(() => {
  const p = bankPickerRow.value?.id
  if (!p) return []
  return props.supplierOptionsWithAll.obj[p]?.supplierAccounts || []
})
function onPartnerPrincipalChange(record, id) {
  record.bankInfo = {}
  record.counterpartyName = id
    ? props.supplierOptionsWithAll?.obj?.[id]?.name
    : undefined
  emit('change')
}

function onOurPrincipalChange(record, id) {
  record.companyName = id
    ? ourSubjectOptionList.value.find((o) => o.id === id)?.companyName
    : undefined
  emit('change')
}

function openBankAccountModal(record) {
  if (record.role !== 'partner') return
  if (!record.id) {
    message.warning('请先选择参与主体')
    return
  }
  bankPickerRow.value = record
  bankPickerOpen.value = true
}

function onBankAccountConfirm(obj) {
  bankPickerRow.value.bankInfo = obj
}

const ourSubjectOptionList = computed(() => {
  const v = props.subjectOptionsWithAll
  return Array.isArray(v?.arr) ? v.arr : []
})

function isOurSubjectOptionDisabled(opt, currentRecord) {
  const usedElsewhere = props.formState.participantRows.some(
    (r) => r.role === 'our' && r !== currentRecord && r.id === opt.id
  )
  return usedElsewhere && opt.id !== currentRecord.id
}

const partnerSupplierOptionList = computed(() => {
  const v = props.supplierOptionsWithAll
  return Array.isArray(v?.arr) ? v.arr : []
})

function isPartnerSupplierOptionDisabled(opt, currentRecord) {
  const usedElsewhere = props.formState.participantRows.some(
    (r) => r.role === 'partner' && r !== currentRecord && r.id === opt.id
  )
  return usedElsewhere && opt.id !== currentRecord.id
}

const partyColumns = [
  { title: '参与方', key: 'party', dataIndex: 'role', width: 110 },
  {
    title: '参与主体',
    key: 'id',
    dataIndex: 'id',
    width: 260
  },
  { title: '银行账户信息', key: 'bank', dataIndex: 'bankInfo', width: 380 },
  { title: '操作', key: 'action', width: 100, fixed: 'right' },
]

function opts(fieldName) {
  return baseSelectOptions[fieldName] || []
}

function nextId() {
  return `p-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

function countPartyByRole(role) {
  return props.formState.participantRows.filter((r) => r.role === role).length
}

function canRemoveParty(record) {
  if (disabledKeys.value.includes('参与主体')) return true
  if (record.role === 'our') return countPartyByRole('our') == 1
  if (record.role === 'partner') return countPartyByRole('partner') == 1
  return false
}

function addOur() {
  props.formState.participantRows.push({
    role: 'our',
    bankInfo: {},
  })
  emit('change')
}

function addPartner() {
  props.formState.participantRows.push({
    role: 'partner',
    bankInfo: {},
  })
  emit('change')
}

function removeParty(index) {
  props.formState.participantRows.splice(index, 1)
  emit('change')
}
</script>

<style lang="scss" scoped>
.party-table-wrapper {
  box-shadow: 0px 0px 1px 0px rgba(0, 0, 0, 0.08), 0px 1px 2px 0px rgba(25, 15, 15, 0.07), 0px 2px 4px 0px rgba(0, 0, 0, 0.05);
  border-radius: 6px;
  padding: 10px;
}

.party-actions {
  margin-top: 10px;
}


:deep(.ant-table-container) {
  border-inline-start: 1px solid #f0f0f0 !important;
  border-inline-end: 1px solid #f0f0f0 !important;
}

:deep(.ant-table-content) {

  table {
    border-top: 1px solid #f0f0f0 !important;
  }
}
</style>
