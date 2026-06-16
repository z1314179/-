<template>
  <div class="page-content">
    <SearchCard :is-exp="true">
      <a-form layout="inline" autocomplete="off" :label-col="{ style: { width: '100px' } }">
        <a-form-item label="合同名称">
          <a-input v-model:value="formState.key" :maxlength="200" allow-clear placeholder="请输入" />
        </a-form-item>
        <a-form-item label="对方客商">
          <a-input v-model:value="formState.counterpartyName" :maxlength="200" allow-clear placeholder="请输入" />
        </a-form-item>
        <a-form-item label="合同分类">
          <a-select class="select-placeholder" allow-clear v-model:value="formState.contractCategory"
            :options="categoryOptionsWithAll.arr" placeholder="全部" />
        </a-form-item>
        <a-form-item label="合同状态">
          <a-select class="select-placeholder" allow-clear v-model:value="formState.status"
            :options="contractStatusList.arr" placeholder="全部" />
        </a-form-item>
        <a-form-item label="签约日期">
          <a-range-picker v-model:value="formState.signDateRange" value-format="YYYY-MM-DD"
            :placeholder="['开始日期', '结束日期']" />
        </a-form-item>
        <a-form-item label="合同开始日期">
          <a-range-picker v-model:value="formState.dateRange" value-format="YYYY-MM-DD"
            :placeholder="['开始日期', '结束日期']" />
        </a-form-item>
        <a-form-item label="我方主体">
          <a-select class="select-placeholder" allow-clear v-model:value="formState.ourCompanyId"
            :options="subjectOptionsWithAll.all" :fieldNames="{
              label: 'companyName',
              value: 'id',
            }" placeholder="全部" />
        </a-form-item>
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
      <div class="pd-t-medium text-right" v-if="PERM('意向合同新增')">
        <a-button type="primary" @click="handleOpenTemplateModal">新 增</a-button>
      </div>
      <a-table class="mg-t-medium" row-key="id" :columns="columns" :data-source="dataSource" :loading="loadTable"
        :pagination="searchQuery" :scroll="{ x: 2000 }" @change="handleTableChange">
        <template #bodyCell="{ column, text, record, index }">
          <template v-if="column.dataIndex === 'index'">
            {{ (searchQuery.current - 1) * searchQuery.pageSize + index + 1 }}
          </template>
          <template v-else-if="['ourCompanyRelations', 'counterpartyRelations'].includes(column.dataIndex)">
            <a-tooltip :title="text">
              <span class="cell-text-ellipsis">{{ text || '-' }}</span>
            </a-tooltip>
          </template>
          <template v-else-if="column.dataIndex === 'contractName'">
            <a-tooltip :title="text">
              <a-button type="link" class="cell-text-ellipsis"
                @click="toRouterQuery('/contract/intention/detail', { id: record.id, template: record.dingProcessCode })">
                {{ text }}
              </a-button>
            </a-tooltip>
          </template>
          <template v-else-if="column.dataIndex === 'amountTaxIncluded'">
            {{ nFormat(text, 2) }}
          </template>
          <template v-else-if="column.dataIndex === 'status'">
            <span class="tag_base" :class="contractStatusList.obj[text]?.class || ''">
              {{ contractStatusList.obj[text]?.label || '-' }}
            </span>
          </template>
          <template v-else-if="column.dataIndex === 'action'">
            <a-button v-if="PERM('意向合同编辑') && record.status === 0" class="mg-r-small" type="link"
              @click="handleSubmit(record)">提交</a-button>
            <a-button v-if="PERM('意向合同编辑')" class="mg-r-small" :disabled="[1, 2].includes(record.status)" type="link"
              @click="handleEdit(record)">编辑</a-button>
            <a-popconfirm v-if="PERM('意向合同删除')" :disabled="record.isRelated || [1, 2].includes(record.status)"
              class="mg-r-small" title="你确定要删除吗？" placement="top" ok-text="确定" @confirm="handleDelete(record)"
              cancel-text="取消">
              <a-button :disabled="record.isRelated || [1, 2].includes(record.status)" type="link">删除</a-button>
            </a-popconfirm>
            <a-button v-if="PERM('意向合同历史版本查看') && record.versionCode != 'V1.0'" class="mg-r-small" type="link"
              @click="handleOpenHistoryModal(record)">历史版本查看</a-button>
          </template>
        </template>
      </a-table>
    </a-card>
    <TemplateSelectModal v-model:open="templateModalOpen" :template-options="templateOptions" @next="handleNext" />
    <HistoryVersionModal v-model:open="historyModalOpen" :row-data="rowData" />
  </div>
</template>
<script setup>
defineOptions({ name: 'ContractIntentionPage' })
import { onActivated, ref, inject } from 'vue'

const PERM = inject('PERM')
import SearchCard from '@/components/system/SearchCard.vue'
import groupNum from '@/components/system/groupNum.vue'
import cascaderCheck from '@/components/system/cascaderCheck.vue'
import TemplateSelectModal from '../components/modals/TemplateSelectModal.vue'
import HistoryVersionModal from '../components/modals/HistoryVersionModal.vue'
import useTable from '@/hook/useTable.js'
import { contractStatusFn } from '@/utils/codeMap/basic.js'
import { getIntentionContractList, deleteIntentionContract, submitToDing } from '@/api/Contract/intention'
import { getTemplateList } from '@/api/Basic/template'
import useTabs from '@/hook/useTabs.js'
import hookMap from '../hookMap.js'
import { message } from 'ant-design-vue'
const rowData = ref({})
const sortDate = (a, b, field) => {
  const av = a[field] ? String(a[field]) : ''
  const bv = b[field] ? String(b[field]) : ''
  return av.localeCompare(bv)
}
const { setParams, getParams, deptList } = useTabs({ dept: true })
const { contractStatusList, categoryOptionsWithAll, subjectOptionsWithAll } = hookMap([1])
const columns = [
  { title: '序号', dataIndex: 'index', key: 'index', width: 60, },
  { title: '合同名称', dataIndex: 'contractName', key: 'contractName', width: 180, ellipsis: true },
  {
    title: '合同分类', dataIndex: 'contractCategory', key: 'contractCategory', width: 120,
    customRender: ({ record }) => {
      return categoryOptionsWithAll.obj[record.contractCategory]?.label || '-'
    }

  },
  { title: '我方主体', dataIndex: 'ourCompanyRelations', key: 'ourCompanyRelations', width: 180, ellipsis: true },
  { title: '品牌', dataIndex: 'brandName', key: 'brandName', width: 100 },
  { title: '对方客商', dataIndex: 'counterpartyRelations', key: 'counterpartyRelations', width: 180, ellipsis: true },
  { title: '合同金额(元)', dataIndex: 'amountTaxIncluded', key: 'amountTaxIncluded', width: 100, },
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
  { title: '操作', dataIndex: 'action', key: 'action', width: 200, fixed: 'right' },
]
const templateModalOpen = ref(false)
const templateOptions = ref([])
const historyModalOpen = ref(false)
const handleOpenTemplateModal = () => {
  templateModalOpen.value = true
}
const handleNext = (template) => {
  toRouterQuery('/contract/intention/edit', { mode: '新增意向合同', template: template.dingProcessCode, templateId: template.id })
}
const handleEdit = (record) => {
  toRouterQuery('/contract/intention/edit', {
    id: record?.id, mode: '编辑合同',
    templateId: record.templateId,
    template: record.dingProcessCode,
  })
}
const handleOpenHistoryModal = (record) => {
  rowData.value = record
  historyModalOpen.value = true
}
const getApi = async (query) => {
  const { data, total } = await getIntentionContractList(query)
  data.data.forEach(item => {
    item.ourCompanyRelations = item.ourCompanyRelations?.map(item => item.companyName).join('、')
    item.counterpartyRelations = item.counterpartyRelations?.map(item => item.counterpartyName).join('、')
  })
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
  return query
}
const { dataSource, loadTable, searchQuery, handleTableChange, getList, search, formState, reset, toRouterQuery, nFormat } = useTable(getApi, {}, { getSearchQuery: getSearchQuery })
const getTemplateLists = async () => {
  const { data } = await getTemplateList({ isAll: 1, checkPermission: 1 })
  templateOptions.value = data.filter(item => item.status === 1)
}
const handleDelete = async (record) => {
  const res = await deleteIntentionContract({ id: record.id })
  if (res.errno === 0) {
    message.success('删除成功')
    getList('del')
  }
}
const loadbtn = ref(false)
const handleSubmit = async (record) => {
  if (loadbtn.value) {
    return
  }
  loadbtn.value = true
  const res = await submitToDing({ id: record.id })
  if (res.errno === 0) {
    message.success('提交成功')
    getList()
  }
  loadbtn.value = false
}
onActivated(() => {
  getTemplateLists()
  getList()
})
</script>

<style scoped lang="scss"></style>
