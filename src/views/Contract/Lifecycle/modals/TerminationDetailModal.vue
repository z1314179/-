<template>
  <a-modal :open="open" :mask-closable="false" width="780px" title="终止详情" destroy-on-close @cancel="handleClose">
    <a-radio-group v-model:value="activeTab" button-style="solid" class="mg-b-medium radio_group_bg">
      <a-radio-button value="info">审批信息</a-radio-button>
      <a-radio-button value="record">审批记录</a-radio-button>
    </a-radio-group>

    <div v-show="activeTab === 'info'" class="term-detail">
      <a-form class="info_form pd-x-small" autocomplete="off">
        <a-form-item label="合同号">
          <a-button type="link" @click="handleOpenContractDetail">{{ formModel.contractNo || '-' }}</a-button>
        </a-form-item>
        <a-form-item label="终止协议号">
          {{ formModel.finalCode }}
        </a-form-item>
        <a-form-item label="终止协议名称">
          {{ formModel.finalName }}
        </a-form-item>
        <a-form-item label="合同终止日期">
          {{ formModel.finalDate }}
        </a-form-item>
        <a-form-item label="终止原因">
          {{ formModel.finalReason }}
        </a-form-item>
        <a-form-item label="附件">
          <template v-if="formModel.fileList.length">
            <div v-for="(item, index) in formModel.fileList" :key="index" style="max-width: 260px"
              :style="{ marginTop: index > 0 ? '4px' : '0' }">
              <FileRowItem :item="item.fileName">
                <template #right>
                  <a-button class="mg-l-small" type="link" @click="handleDownloadAttachment(item)">下载</a-button>
                </template>
              </FileRowItem>
            </div>
          </template>
          <span v-else>-</span>
        </a-form-item>
        <a-form-item label="审批状态">
          {{ formModel.approvalStatusLabel }}
        </a-form-item>
      </a-form>
    </div>
    <div v-show="activeTab === 'record'" class="term-detail-record">
      <ApprovalDetailTimeline :workflow-fore-data="formModel.workflowForeData" />
    </div>

    <template #footer>
      <div class="text-right">
        <a-button @click="handleClose">关 闭</a-button>
        <template v-if="showApprovalActions">
          <a-button :disabled="approving" danger ghost class="mg-l-small" @click="openApprovalModal('reject')">拒
            绝</a-button>
          <a-button :disabled="approving" type="primary" class="mg-l-small" @click="openApprovalModal('pass')">通
            过</a-button>
        </template>
      </div>
    </template>
  </a-modal>
  <ApprovalPassRejectModal v-model:open="approvalModalOpen" :type="approvalActionType"
    @confirm="handleApprovalConfirm" />
</template>

<script setup>
import { computed, ref, watch, inject } from 'vue'
import { useRouter } from 'vue-router'
const PERM = inject('PERM')
import { message } from 'ant-design-vue'
import FileRowItem from '@/components/upload/FileRowItem.vue'
import ApprovalPassRejectModal from '@/components/system/ApprovalPassRejectModal.vue'
import ApprovalDetailTimeline from '@/views/Contract/components/ApprovalDetailTimeline.vue'
import { downloadFile } from '@/utils/preview.js'
import { approveContractFinal } from '@/api/Contract/lifecycle'

defineOptions({ name: 'LifecycleTerminationDetailModal' })

const FINAL_STATUS_MAP = {
  0: { label: '草稿', class: 'tag_cg' },
  1: { label: '审批中', class: 'tag_spz' },
  2: { label: '已通过', class: 'tag_wks' },
  3: { label: '已拒绝', class: 'tag_yjj' },
}

const props = defineProps({
  open: { type: Boolean, default: false },
  detail: { type: Object, default: null },
  findCurrentUserRunningTask: { type: Function, default: null },
})

const emit = defineEmits(['update:open', 'refresh'])
const router = useRouter()

const activeTab = ref('info')
const approvalModalOpen = ref(false)
const approvalActionType = ref('pass')
const approving = ref(false)

function parseFinalFiles(files) {
  if (files == null || files === '') return []
  if (typeof files === 'string') {
    try {
      const parsed = JSON.parse(files)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return Array.isArray(files) ? files : []
}

function handleDownloadAttachment(item) {
  const url = item?.fileUrl ?? item?.data
  if (!url) return
  downloadFile({ data: url, fileName: item.fileName })
}

const formModel = computed(() => {
  const d = props.detail
  if (!d) {
    return {
      contractNo: '-',
      finalCode: '-',
      finalName: '-',
      finalDate: '-',
      finalReason: '-',
      fileList: [],
      approvalStatusLabel: '-',
      approvalStatusClass: '',
      workflowForeData: {},
    }
  }
  const status = FINAL_STATUS_MAP[d.finalStatus]
  return {
    contractNo: d.contract?.contractNo || '-',
    finalCode: d.finalCode || '-',
    finalName: d.finalName || '-',
    finalDate: d.finalDate || '-',
    finalReason: d.finalReason || '-',
    fileList: parseFinalFiles(d.finalFiles),
    approvalStatusLabel: status?.label || '-',
    approvalStatusClass: status?.class ? `tag_base ${status.class}` : '',
    workflowForeData: {
      workflowForecastNodes: d.forecastJson?.workflowForecastNodes,
      workflowActivityRules: d.forecastJson?.workflowActivityRules,
      processInstances: d.extJson,
    },
  }
})

const currentTask = computed(() => {
  if (!props.detail) return null
  return props.findCurrentUserRunningTask?.(props.detail.extJson) ?? null
})

const handlePerm = computed(() => !!(currentTask.value?.taskId))

const showApprovalActions = computed(() => PERM('生命周期审批') && props.detail?.finalStatus === 1 && handlePerm.value)

watch(
  () => props.open,
  (v) => {
    if (v) activeTab.value = 'info'
  },
)

function handleClose() {
  emit('update:open', false)
}

function handleOpenContractDetail() {  
  const id = props.detail?.contractId
  if (!id) {
    message.warning('缺少合同 ID')
    return
  }
  handleClose()
  router.push({
    path: '/contract/lifecycle/detail',
    query: { id },
  })
}

function openApprovalModal(type) {
  approvalActionType.value = type
  approvalModalOpen.value = true
}

async function handleApprovalConfirm({ type, reason }) {
  if (approving.value) return
  const id = props.detail?.id
  const taskId = currentTask.value?.taskId
  if (!id) {
    message.warning('缺少终止记录 ID')
    return
  }
  if (!taskId) {
    message.warning('缺少钉钉任务 ID')
    return
  }
  approving.value = true
  try {
    const res = await approveContractFinal({
      id,
      taskId,
      result: type === 'reject' ? 'refuse' : 'agree',
      remark: reason ?? '',
    })
    if (res.errno === 0) {
      message.success(type === 'reject' ? '已拒绝' : '审批通过')
      emit('update:open', false)
      emit('refresh')
    }
  } finally {
    approving.value = false
  }
}
</script>

<style lang="scss" scoped>
.term-detail-record {
  min-height: 200px;
}
</style>
