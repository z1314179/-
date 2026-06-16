<template>
  <div class="contract-list-container">
    <SearchCard :is-exp="true">
      <a-form layout="inline" autocomplete="off" :label-col="{ style: { width: '96px' } }">
        <a-form-item label="合同名称">
          <a-input v-model:value="formState.key" :maxlength="200" allow-clear placeholder="名称/编号" />
        </a-form-item>
        <a-form-item label="对方客商">
          <a-input v-model:value="formState.counterpartyName" :maxlength="200" allow-clear placeholder="请输入" />
        </a-form-item>
        <a-form-item label="合同分类">
          <a-select class="select-placeholder" allow-clear v-model:value="formState.contractCategory"
            :options="categoryOptionsWithAll.arr" placeholder="全部" />
        </a-form-item>
        <a-form-item label="合同类型">
          <a-select class="select-placeholder" allow-clear v-model:value="formState.contractType"
            :options="contractTypeList.arr" placeholder="全部" />
        </a-form-item>
        <a-form-item label="合同状态">
          <a-select class="select-placeholder" allow-clear v-model:value="formState.status"
            :options="contractStatusList" placeholder="全部" />
        </a-form-item>
        <a-form-item label="签约日期">
          <a-range-picker v-model:value="formState.signDateRange" value-format="YYYY-MM-DD"
            :placeholder="['开始日期', '结束日期']" />
        </a-form-item>
        <a-form-item label="合同开始日期">
          <a-range-picker v-model:value="formState.validityDateRange" value-format="YYYY-MM-DD"
            :placeholder="['开始日期', '结束日期']" />
        </a-form-item>
        <a-form-item label="我方主体">
          <a-select class="select-placeholder" allow-clear v-model:value="formState.ourCompanyId"
            :options="subjectOptionsWithAll.all" :fieldNames="{
              label: 'companyName',
              value: 'id',
            }" placeholder="全部" />
        </a-form-item>
        <!-- <a-form-item label="品牌">
          <a-select class="select-placeholder" allow-clear v-model:value="formState.brandName"
            :options="brandOptionsWithAll.arr" :fieldNames="{ label: 'label', value: 'value' }" placeholder="全部" />
        </a-form-item> -->
        <a-form-item label="合同金额">
          <groupNum v-model:start="formState.amountMin" v-model:end="formState.amountMax" :precision="2" />
        </a-form-item>
        <a-form-item label="经办人">
          <a-input v-model:value="formState.handlerUserName" :maxlength="50" allow-clear placeholder="请输入" />
        </a-form-item>
        <a-form-item label="经办部门">
          <cascaderCheck class="select-placeholder" v-model:value="formState.handlerDeptId" :options="deptList"
            :field-names="{
              label: 'name',
              value: 'id',
              children: 'children',
            }" show-search tree-node-filter-prop="name" tree-default-expand-all tree-data-simple-mode placeholder="全部"
            allow-clear />
        </a-form-item>
      </a-form>
      <template #right>
        <a-button class="mg-l-1" @click="reset">重 置</a-button>
        <a-button class="mg-l-1" type="primary" @click="search">查 询</a-button>
      </template>
    </SearchCard>
    <a-card class="card_table mg-t-small">
      <div class="flex justify-between align-center mg-y-medium">
        <div class="flex-1">
          <a-tabs v-model:activeKey="clauseActiveKey" @change="handleChange">
            <a-tab-pane :key="1" :tab="totalStr"> </a-tab-pane>
            <a-tab-pane :key="2" :tab="waitStr"></a-tab-pane>
          </a-tabs>
        </div>
        <div>
          <a-button v-if="PERM('生命周期新增')" type="primary" @click="handleOpenImportModal" ghost>引入意向合同</a-button>
          <a-button v-if="PERM('生命周期新增')" type="primary" class="mg-l-1" @click="handleOpenTemplateModal">新增</a-button>
        </div>
      </div>
      <a-table row-key="id" :columns="columns" :data-source="dataSource" :loading="loadTable" :pagination="searchQuery"
        :scroll="{ x: 2200 }" @change="handleTableChange">
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
          <template v-else-if="column.dataIndex === 'contractCategory'">
            {{ categoryOptionsWithAll.obj[text]?.label || categoryOptionsWithAll.obj[Number(text)]?.label || '-' }}
          </template>
          <template v-else-if="column.dataIndex === 'contractType'">
            {{ contractTypeList.obj[Number(text)]?.label ?? contractTypeList.obj[text]?.label ?? text ?? '-' }}
          </template>
          <template v-else-if="column.dataIndex === 'contractName'">
            <a-tooltip :title="text">
              <template v-if="borrowContracts[record.id] && record.handlerUserId != userInfos.id">
                <a-button v-if="borrowContracts[record.id].canView == 1" type="link" class="cell-text-ellipsis"
                  @click="toRouterQuery('/contract/lifecycle/detail', { id: record.id })">
                  {{ text }}
                </a-button>
                <div v-else class="cell-text-ellipsis">
                  {{ text }}
                </div>
              </template>
              <a-button v-else type="link" class="cell-text-ellipsis"
                @click="toRouterQuery('/contract/lifecycle/detail', { id: record.id })">
                {{ text }}
              </a-button>
            </a-tooltip>
          </template>
          <template v-else-if="column.dataIndex === 'amountTaxIncluded'">
            {{ nFormat(text, 2) }}
          </template>
          <template v-else-if="column.dataIndex === 'status'">
            <span class="tag_base" :class="contractStatusObj[text]?.class || ''">
              {{ contractStatusObj[text]?.label || '-' }}
            </span>
          </template>
          <template v-else-if="column.dataIndex === 'action'">
            <template v-if="record.canViewByUserPermission == 1">
              <a-button type="link" class="mg-r-small" v-if="record.status === 0 && PERM('生命周期变更')" key="submit"
                @click="handleSubmit(record)">提交</a-button>
              <a-button v-if="PERM('生命周期编辑') && [0, 1, 3].includes(record.status)" type="link" class="mg-r-small"
                :disabled="![0, 3].includes(record.status)" @click="handleEdit(record)">编辑</a-button>
              <a-button v-else-if="PERM('生命周期变更')" type="link" :disabled="![10, 11].includes(record.status)"
                @click="handleOpenChange(record)" class="mg-r-small">变更</a-button>
              <a-popconfirm v-if="PERM('生命周期删除')" :disabled="![0].includes(record.status)" class="mg-r-small"
                title="你确定要删除吗？" placement="top" ok-text="确定" cancel-text="取消" @confirm="handleDelete(record)">
                <a-button :disabled="![0].includes(record.status)" type="link">删除</a-button>
              </a-popconfirm>

              <!-- <a-popconfirm v-if="[1].includes(record.status)" class="mg-r-small" title="你确定要作废吗？" placement="top"
              ok-text="确定" cancel-text="取消" @confirm="handleVoid(record)">
              <a-button type="link">作废</a-button>
            </a-popconfirm> -->
              <a-dropdown v-if="showMoreMenu(record)" class="mg-r-small">
                <a-button type="link">更多
                  <DownOutlined />
                </a-button>
                <template #overlay>
                  <a-menu :selectable="false">
                    <a-menu-item v-if="PERM('生命周期续签') && [4].includes(record.status)" key="renew"
                      @click="handleOpenRenew(record)">续签</a-menu-item>
                    <a-menu-item v-if="PERM('生命周期终止') && [10, 11].includes(record.status)" key="terminate"
                      @click="handleOpenTerminate(record)">终止</a-menu-item>
                    <!-- <a-menu-item key="bill" @click="handleOpenBill(record)">查看账单</a-menu-item> -->
                    <a-menu-item v-if="PERM('生命周期附件下载')" key="attach"
                      @click="handleAttachmentsDownload(record)">附件下载</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </template>
            <template v-else-if="borrowContracts[record.id] && record.handlerUserId != userInfos.id">
              <a-button type="link" class="mg-r-small"
                v-if="PERM('生命周期附件下载') && borrowContracts[record.id].canDownloadAttachment == 1"
                @click="handleAttachmentsDownload(record, 'borrow')">附件下载</a-button>
            </template>

          </template>
        </template>
      </a-table>
    </a-card>
    <!-- 选择合同模板 -->
    <TemplateSelectModal v-model:open="templateModalOpen" :template-options="templateOptions" @next="handleNext" />
    <!-- 导入意向合同 -->
    <ImportIntentionDrawer v-model:open="importModalOpen" @submit="handleImportSubmit"
      :subject-options-with-all="subjectOptionsWithAll" :category-options-with-all="categoryOptionsWithAll"
      :dept-list="deptList" />
    <!-- 终止合同 -->
    <TerminateContractModal v-model:open="terminateModalOpen" mode="create" :detail="billRecord" @refresh="getList" />
    <!-- 查看账单 -->
    <PaymentPlanModal v-model:open="paymentPlanModalOpen" :detail="billRecord" />
  </div>
</template>

<script setup>
import { onActivated, ref, computed, inject } from 'vue'

const PERM = inject('PERM')
import { message } from 'ant-design-vue'
import SearchCard from '@/components/system/SearchCard.vue'
import groupNum from '@/components/system/groupNum.vue'
import cascaderCheck from '@/components/system/cascaderCheck.vue'
import TemplateSelectModal from '../components/modals/TemplateSelectModal.vue'
import ImportIntentionDrawer from './modals/ImportIntentionDrawer.vue'
import TerminateContractModal from './modals/TerminateContractModal.vue'
import TerminationDetailModal from './modals/TerminationDetailModal.vue'
import PaymentPlanModal from './modals/PaymentPlanModal.vue'
import useTable from '@/hook/useTable.js'
import { formatDateTime } from '@/utils/com.js'
import {
  getContractList,
  deleteContract,
  updateContract,
  submitContractToDing,
} from '@/api/Contract/lifecycle'
import { getTemplateList } from '@/api/Basic/template'
import { contractStatusFn } from '@/utils/codeMap/basic.js'
import { DownOutlined } from '@ant-design/icons-vue'
import { downloadPack, toWatermarkPdf, toWatermarkFileUrlToPdf } from '@/utils/preview.js'
defineOptions({ name: 'ContractLifecycleList' })

const props = defineProps({
  subjectOptionsWithAll: { type: Object, default: () => { } },
  categoryOptionsWithAll: { type: Object, required: true },
  brandOptionsWithAll: { type: Object, required: true },
  contractTypeList: { type: Object, required: true },
  deptList: { type: Array, default: () => [] },
  borrowContracts: { type: Object, default: () => [] },
  userInfos: { type: Object, default: () => { } },
})


const { contractStatusObj, contractStatusList } = contractStatusFn()
const pendingApproveCount = ref(0)
const attachmentsDownloading = ref(false)
const clauseActiveKey = ref(1)
const totalStr = ref('全部合同')
const waitStr = ref('待审批')
const handleChange = () => {
  getList()
}
function formatOurCompanies(record) {
  return record?.ourCompanyRelations?.map((item) => item.companyName).join('、') || ''
}

function formatCounterparties(record) {
  return record?.counterpartyRelations?.map((item) => item.counterpartyName).join('、') || ''
}

function showMoreMenu(record) {
  const s = record.status
  return (
    (PERM('生命周期续签') && [4].includes(s)) ||
    (PERM('生命周期终止') && [10, 11].includes(s)) ||
    PERM('生命周期附件下载')
  )
}

/** 与 Basic/Template downloadPack 用法一致：当前行 attachments 打成 zip */
async function handleAttachmentsDownload(record, type = 'normal') {
  if (attachmentsDownloading.value) {
    message.warning('下载中，请勿重复点击')
    return
  }
  const list = record?.attachments
  if (!Array.isArray(list) || !list.length) {
    message.warning('暂无附件')
    return
  }
  attachmentsDownloading.value = true
  try {
    let files = []
    if (type == 'borrow') {
      let urls = list.map((item) => {
        const name = props.userInfos.username + '-合同借阅'
        const timer = formatDateTime(new Date(), 'yyyy-MM-dd HH:mm:ss')
        return {
          url: process.env.IMG + item.fileUrl,
          watermark: `${timer},${name}`,
        }
      })
      files = await toWatermarkFileUrlToPdf({
        list: urls
      })
      files = files.map(item => ({
        data: item.data,
        name: item.name,
      }))
    } else {
      files = list.map(async (item) => item.fileUrl)
    }
    await downloadPack(files, `${record.contractName}-附件`)
  } finally {
    attachmentsDownloading.value = false
  }
}

const columns = [
  { title: '序号', dataIndex: 'index', key: 'index', width: 60 },
  { title: '合同名称', dataIndex: 'contractName', key: 'contractName', width: 200 },
  { title: '合同分类', dataIndex: 'contractCategory', key: 'contractCategory', width: 120 },
  { title: '合同类型', dataIndex: 'contractType', key: 'contractType', width: 100 },
  { title: '我方主体', dataIndex: 'ourCompanyRelations', key: 'ourCompanyRelations', width: 200 },
  { title: '品牌', dataIndex: 'brandName', key: 'brandName', width: 100 },
  { title: '对方客商', dataIndex: 'counterpartyRelations', key: 'counterpartyRelations', width: 200 },
  { title: '合同金额(元)', dataIndex: 'amountTaxIncluded', key: 'amountTaxIncluded', width: 100 },
  { title: '合同签署人', dataIndex: 'signUserName', key: 'signUserName', width: 108 },
  {
    title: '签约日期',
    dataIndex: 'signDate',
    key: 'signDate',
    width: 110,
    sorter: true,
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
  { title: '操作', dataIndex: 'action', key: 'action', width: 150, fixed: 'right' },
]
const importModalOpen = ref(false)
const terminateModalOpen = ref(false)
const terminateRecord = ref(null)
const terminationDetailOpen = ref(false)
const terminationDetail = ref(null)
const paymentPlanModalOpen = ref(false)
const billRecord = ref(null)
const templateModalOpen = ref(false)
const templateOptions = ref([])
const importedList = ref([])
const loadbtn = ref(false)

const handleSubmit = async (record) => {
  if (loadbtn.value) return
  loadbtn.value = true
  try {
    const res = await submitContractToDing({ id: record.id })
    if (res.errno === 0) {
      message.success('提交成功')
      getList()
    }
  } finally {
    loadbtn.value = false
  }
}

const handleOpenImportModal = () => {
  importModalOpen.value = true
}
const handleImportSubmit = (rows) => {
  toRouterQuery('/contract/lifecycle/edit', { mode: '新增合同', intentionId: rows.id })
}
const handleOpenTemplateModal = () => {
  templateModalOpen.value = true
}
const handleNext = (template) => {
  toRouterQuery('/contract/lifecycle/edit', {
    mode: '新增合同',
    template: template.dingProcessCode,
    templateId: template.id,
  })
}
const getTemplateLists = async () => {
  const { data } = await getTemplateList({ isAll: 1, checkPermission: 1 })
  templateOptions.value = data
}

const handleOpenBill = (record) => {
  billRecord.value = record || null
  paymentPlanModalOpen.value = true
}
const handleOpenTerminate = (record) => {
  billRecord.value = record || null
  terminateModalOpen.value = true
}

const handleDelete = async (record) => {
  if (String(record?.id ?? '').startsWith('import-')) {
    const idx = importedList.value.findIndex((x) => x.id === record?.id)
    if (idx > -1) {
      importedList.value.splice(idx, 1)
      message.success('已删除')
      getList()
    }
    return
  }
  const res = await deleteContract({ id: record.id })
  if (res.errno === 0) {
    message.success('删除成功')
    getList('del')
  }
}
const handleEdit = (record) => {
  record.contractType
  let obj = {
    2: 'change',
    3: 'renew',
  }
  toRouterQuery('/contract/lifecycle/edit', { id: record?.id, type: obj[record.contractType] || 'edit', mode: '编辑合同' })
}
const handleOpenChange = (record) => {
  toRouterQuery('/contract/lifecycle/edit', { id: record.id, type: 'change', mode: '变更合同' })
}
const handleOpenRenew = (record) => {
  toRouterQuery('/contract/lifecycle/edit', { id: record.id, type: 'renew', mode: '续签合同' })
}

const handleVoid = async (record) => {
  if (String(record?.id ?? '').startsWith('import-')) {
    const idx = importedList.value.findIndex((x) => x.id === record?.id)
    if (idx > -1) {
      importedList.value.splice(idx, 1)
      message.success('已作废')
      getList()
    }
    return
  }
  const res = await updateContract({ id: record.id, status: 8 })
  if (res.errno === 0) {
    message.success('作废成功')
    getList()
  }
}

const getApi = async (query) => {
  if (clauseActiveKey.value === 1) {
  } else {
    query.tabStatus = 1
  }
  const { data } = await getContractList(query)
  totalStr.value = `全部合同(${data.tabTotal || 0})`
  waitStr.value = `待审批(${data.pendingApproveCount || 0})`
  return { data: data.data, total: data.total }
}

const getSearchQuery = (query) => {
  if (query.signDateRange) {
    query.signDateStart = query.signDateRange[0]
    query.signDateEnd = query.signDateRange[1]
    delete query.signDateRange
  }
  if (query.validityDateRange) {
    query.startDateStart = query.validityDateRange[0]
    query.startDateEnd = query.validityDateRange[1]
    delete query.validityDateRange
  }
  return query
}

const {
  dataSource,
  loadTable,
  searchQuery,
  handleTableChange,
  getList,
  search,
  formState,
  reset,
  toRouterQuery,
  nFormat,
} = useTable(getApi, {}, { getSearchQuery })

const getloadTable = () => {
  getTemplateLists()
  getList()
}
onActivated(() => {

})
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

  .ant-tabs-tab-active {
    .ant-tabs-tab-btn {
      font-weight: 500;
      color: var(--text-color);
    }

  }

}
</style>