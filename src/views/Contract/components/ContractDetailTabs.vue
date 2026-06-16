<template>
  <div class="pd-t-medium">
    <div class="detail-header">
      <div>
        <div class="flex align-center">
          <div class="header-title">
            {{ formState.contractName }}
          </div>
          <!-- <div class="mg-l-small flex align-center">
            <span v-if="contractStatusList.obj[formState.status]" class="tag_base"
              :class="contractStatusList.obj[formState.status]?.class || ''">
              {{ contractStatusList.obj[formState.status]?.label || '-' }}
            </span>
          </div> -->
        </div>
        <div class="flex footer-info">
          <span>合同效期：{{ formState.timer }}</span>
          <span class="line-dot"></span>
          <div>
            签约日期：{{ formState.signDate }}
          </div>
          <span class="line-dot"></span>
          <div>
            合同金额：¥{{ toFixedNumberString(formState.amountTaxIncluded) }}
          </div>
        </div>
      </div>
      <div>
        <slot name="headerActions" />
      </div>
    </div>
    <div class="pd-t-medium pd-x-large">
      <a-tabs v-model:activeKey="tabsState.activeKey" size="large">
        <a-tab-pane key="1" tab="合同信息"></a-tab-pane>
        <a-tab-pane key="2" tab="业务信息"></a-tab-pane>
        <a-tab-pane key="3" tab="审批详情"></a-tab-pane>
      </a-tabs>
    </div>
    <div class="cancellation1 pd-b-medium pd-x-large">
      <a-form class="info_form" layout="vertical">
        <template v-if="tabsState.activeKey === '1'">
          <a-card class="mg-t-medium" title="基础信息">
            <div class="flex flex-wrap" style="max-width: 900px;">
              <a-form-item v-for="(row, idx) in detailTab1FieldRows" :key="row.name + '-' + idx" :label="row.label">
                {{ formatDetailTab1Value(row) }}
              </a-form-item>
              <a-form-item v-if="detailTypeUnref" label="生效日期">
                {{ formState.changeEffectiveDate }}
              </a-form-item>
              <a-form-item label="备注" :style="detailTab1ItemStyle()">
                {{ formState.remark }}
              </a-form-item>
              <div style="width: 100%;" class="flex">
                <a-form-item label="我方主体" style="width: 424px;">
                  {{formState.participantRowsWF?.map(item => item.companyName).join('、')}}
                </a-form-item>
                <a-form-item label="对方客商" style="width: 424px;">
                  {{formState.participantRowsDF?.map(item => item.counterpartyName).join('、')}}
                  <a-button class="mg-l-small" type="link" @click="handleOpenPartnerModal">
                    客商详情
                  </a-button>
                </a-form-item>
              </div>
            </div>
          </a-card>
          <a-card class="mg-t-small" title="附件信息">
            <div style="max-width: 1260px">
              <a-table :columns="attachmentColumns" :data-source="formState.attachments" :pagination="false"
                row-key="id" :scroll="{ x: 760 }">
                <template #bodyCell="{ column, record, index }">
                  <template v-if="column.key === 'index'">
                    {{ index + 1 }}
                  </template>
                  <template v-else-if="column.key === 'fileName'">
                    <span class="flex align-center attachment-file-name">
                      <PaperClipOutlined />
                      {{ record.fileName }}
                    </span>
                  </template>
                  <template v-else-if="column.key === 'action'">
                    <a-button type="link" @click="handleAttachmentDownload(record)">
                      下载
                    </a-button>
                  </template>
                </template>
              </a-table>
            </div>
          </a-card>
          <a-card class="mg-t-small card-tabs">
            <a-tabs v-model:activeKey="tabsState.clauseActiveKey" size="large">
              <a-tab-pane key="1" tab="补充条款"></a-tab-pane>
              <a-tab-pane key="2" tab="违约条款"></a-tab-pane>
            </a-tabs>
            <div class="pd-x-large mg-y-medium">
              <div v-if="tabsState.clauseActiveKey == 1 && formState.supplementaryTerms" class="pre-wrap">
                <pre v-html="formState.supplementaryTerms"></pre>
              </div>
              <div v-else-if="tabsState.clauseActiveKey == 2 && formState.breachTerms" class="pre-wrap">
                <pre v-html="formState.breachTerms"></pre>
              </div>
              <div v-else class="flex justify-center align-center">
                <EmptyInfo style="width: 111px; height: 100%;">
                  暂无内容
                </EmptyInfo>
              </div>
            </div>
          </a-card>
        </template>
        <template v-if="tabsState.activeKey === '2'">
          <a-card class="mg-t-medium card-info" title="业务信息" :bordered="false">
            <div v-if="formComponents.YW.length" class="flex flex-wrap" style="max-width: 900px;">
              <DingTemplateRenderer is-detail :schema-items="formComponents.YW" :local-form-data="formState.YW"
                :field-form-name="['YW']" />
            </div>
            <div v-if="formComponents.YW.length" class="row-line mg-y-small"></div>
            <div id="section-related" class="flex align-center pd-t-small">
              <span class="section_text_medium">关联合同</span>
            </div>
            <div style="max-width: 1300px;" class="mg-t-medium">
              <IntentionBusinessSection is-detail v-model:dataSource="formState.contracts" />
            </div>
          </a-card>
          <a-card class="mg-t-medium card-info" title="财务信息" :bordered="false">
            <div v-if="formComponents.CW.length" class="flex flex-wrap" style="max-width: 900px;">
              <DingTemplateRenderer is-detail :schema-items="formComponents.CW" :local-form-data="formState.CW"
                :field-form-name="['CW']" />
            </div>
            <div v-if="formComponents.CW.length" class="row-line mg-y-small"></div>
            <div class="flex flex-wrap" style="max-width: 900px;">
              <FinanceInfoFields is-detail :form-state="formState" />
            </div>
            <div class="row-line mg-y-small" v-if="formComponents.YW.length && formState.amountTaxIncluded">
            </div>
            <div v-if="formState.amountTaxIncluded" style="max-width: 1300px;" class="pd-y-small">
              <span class="section_text_medium">{{ formState.planType === '1' ? '付款' : formState.planType === '2' ? '收款'
                : '收付' }}计划</span>
              <PaymentPlanTable is-detail class="mg-t-medium" :form-state="formState" />
            </div>
            <div class="row-line mg-y-small" v-if="formComponents.YW.length && formState.amountTaxIncluded && String(formState.isBudgetOccupied) === '1'">
            </div>
            <div v-if="formState.amountTaxIncluded && String(formState.isBudgetOccupied) === '1'" style="max-width: 1300px;" class="pd-t-small">
              <span class="section_text_medium">预算分摊</span>
              <BudgetSplitTable class="mg-t-medium" :deptListMap="deptListMap"
                :expenseTypeOptionsWithAll="expenseTypeOptionsWithAll" is-detail :form-state="formState" />
            </div>
          </a-card>
        </template>
        <template v-if="tabsState.activeKey === '3'">
          <a-card class="mg-t-medium" title="审批详情" :bordered="false">
            <div style="max-width: 1300px;">
              <ApprovalDetailTimeline v-if="formState.id" :workflow-fore-data="formState.workflowForeData" />
            </div>
          </a-card>
        </template>
      </a-form>
    </div>
    <PartnerInfoModal :tabState="true" v-model:open="tabsState.partnerModalOpen"
      :bankPickerRows="formState.participantRowsDF" />

  </div>
</template>

<script setup>
defineOptions({ name: 'ContractDetailTabs' })
import { computed, inject, reactive, ref, unref } from 'vue'
import { message } from 'ant-design-vue'
import { PaperClipOutlined } from '@ant-design/icons-vue'
import SchemaForm from '@/components/system/SchemaForm.vue'
import IntentionBusinessSection from './IntentionBusinessSection.vue'
import FinanceInfoFields from './FinanceInfoFields.vue'
import PaymentPlanTable from './PaymentPlanTable.vue'
import BudgetSplitTable from './BudgetSplitTable.vue'
import ApprovalDetailTimeline from './ApprovalDetailTimeline.vue'
import { getDetailTab1FieldRows } from './intentionEditFieldSchema.js'
import PartnerInfoModal from './modals/PartnerInfoModal.vue'
import EmptyInfo from '@/components/system/EmptyInfo.vue'
import DingTemplateRenderer from '@/components/DingTemplateRenderer/index.vue'
import { toFixedNumberString } from '@/utils/com.js'
import hookMap from '../hookMap.js'
import { downloadFile, toWatermarkPdf, toWatermarkFileUrlToPdf } from '@/utils/preview.js'
import { formatDateTime } from '@/utils/com.js'
const props = defineProps({
  formState: {
    type: Object,
    required: true,
  },
  formComponents: {
    type: Object,
    required: true,
  },
  deptListMap: {
    type: Object,
    required: true,
  },
  isBorrow: {
    type: [Object, null],
    default: null,
  },
  userInfos: {
    type: Object,
    default: () => { },
  }
})

const {
  categoryOptionsWithAll,
  contractPropertyOptionsWithAll,
  brandOptionsWithAll,
  subjectOptionsWithAll,
  expenseTypeOptionsWithAll,
  contractStatusList,
  route,
} = hookMap([3])
const detailTab1FieldRows = getDetailTab1FieldRows()
const detailTypeUnref = computed(() => {
  return props.formState.contractType == 2
})

function detailTab1ItemStyle(row) {
  return { width: detailTypeUnref.value ? '200px' : '424px' }
}

function formatDetailTab1Value(row) {
  const s = props.formState
  if (row.optionsFrom === 'category') {
    return categoryOptionsWithAll.obj[s.contractCategory]?.label || s.contractCategory
  }
  return s[row.name]
}

const tabsState = reactive({
  activeKey: '1',
  clauseActiveKey: '1',
  partnerModalOpen: false,
})

const attachmentDownloadingId = ref(null)

//是否是借阅
const isBorrow = computed(() => {
  return props.isBorrow
  // let userIdMap = props.formState.workflowForeData?.processInstances?.tasks.reduce((acc, item) => {
  //   acc[item.userId] = item
  //   return acc
  // }, {})
  // console.log(userIdMap, props.userInfos.dingAccount);


})

/** 附件信息表格表头 */
const attachmentColumns = computed(() => {
  let columns = [
    { title: '序号', key: 'index', width: 60 },
    { title: '文件', key: 'fileName', dataIndex: 'fileName', width: 600 },
    { title: '上传时间', key: 'uploadTime', dataIndex: 'uploadTime', width: 200 },
    { title: '上传人', key: 'createUserName', dataIndex: 'createUserName', width: 200 },
    { title: '操作', key: 'action', width: 200 },
  ]
  // 是借阅
  if (isBorrow.value) {
    if (isBorrow.value.canDownloadAttachment == 1) {
    } else {
      columns.splice(columns.length - 1, 1)
    }
  }
  return columns
})

function handleOpenPartnerModal() {
  tabsState.partnerModalOpen = true
}

async function handleAttachmentDownload(record) {
  const path = record.fileUrl
  if (!path) return
  if (attachmentDownloadingId.value) {
    message.warning('正在下载，请稍候')
    return
  }
  attachmentDownloadingId.value = record.id
  try {
    if (isBorrow.value && isBorrow.value.canDownloadAttachment == 1) {
      const name = props.userInfos.username + '-合同借阅'
      const timer = formatDateTime(new Date(), 'yyyy-MM-dd HH:mm:ss')
      const files = await toWatermarkFileUrlToPdf({
        list: [{
          url: process.env.IMG + record.fileUrl,
          watermark: `${timer},${name}`,
        }]
      })
      downloadFile(files[0].data, files[0].name)
      return
    }
    downloadFile(path)
  } catch (e) {
    console.log(e);

  } finally {
    attachmentDownloadingId.value = null
  }
}
</script>

<style lang="scss" scoped>
.detail-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  // margin-top: 16px;
  padding: 16px 24px;
  background: #ffffff;
  box-shadow:
    0px 0px 1px 0px rgba(0, 0, 0, 0.08),
    0px 1px 2px 0px rgba(25, 15, 15, 0.07),
    0px 2px 4px 0px rgba(0, 0, 0, 0.05);

  .header-title {
    font-weight: 500;
    font-size: 16px;
    line-height: 24px;
  }

  .line-dot {
    width: 1px;
    height: 12px;
    background-color: #F0F0F0;
    margin: 0 8px;
  }

  .footer-info {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.45);
    margin-top: 4px;
    line-height: 18px;
    display: flex;
    align-items: center;
  }
}

.attachment-file-name {
  :deep(.anticon) {
    color: rgba(0, 0, 0, 0.65);
    flex-shrink: 0;
    margin-right: 3px;
  }
}

.info_form {
  :deep(.ant-form-item) {
    margin-right: 24px;

    .ant-form-item-row {
      width: 200px;
    }
  }

  .row-line {
    width: 100%;
    height: 1px;
    background-color: rgba(0, 0, 0, 0.06);
  }
}

.card-info {
  :deep(.ant-card-body) {
    padding: 8px 24px 16px;
  }
}
</style>
