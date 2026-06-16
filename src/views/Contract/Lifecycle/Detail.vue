<template>
  <a-watermark :font="{
    color: 'rgba(0, 0, 0, 0.1)',
  }" :content="borrowWatermarkContent" style="min-height: 100%;">
    <div style="position: relative;min-height: 100%;">

      <ContractDetailTabs :userInfos="userInfos" :isBorrow="isBorrow" :deptListMap="deptListMap" :form-state="formState"
        :form-components="formComponents">
        <template #headerActions>
          <div class="header-actions" v-if="statusApprovalMap[formState.status]">
            <img :src="statusApprovalMap[formState.status]" alt="status" />
          </div>
          <a-button @click="handleClose">关闭</a-button>
          <template v-if="formState.status === 1 && handlePerm">
            <a-button class="mg-l-small" type="primary" ghost style="color: #E5484D;border-color: #E5484D;"
              @click="openApprovalActionModal('reject')">拒绝</a-button>
            <a-button class="mg-l-small" type="primary" @click="openApprovalActionModal('pass')">通过</a-button>
          </template>
          <a-button v-if="PERM('生命周期归档') && !formState.contractNo && [1].includes(formState.status)" class="mg-l-small"
            style="background-color: #30A46C;border-color: #30A46C;" type="primary"
            @click="handleOpenArchive">归档</a-button>
          <a-button v-if="PERM('生命周期变更') && [10, 11].includes(formState.status)" class="mg-l-small" type="primary" ghost
            @click="handleOpenChange">变更</a-button>
        </template>
      </ContractDetailTabs>

      <ApprovalPassRejectModal v-model:open="approvalActionModalOpen" :type="approvalActionType"
        @confirm="handleApprovalConfirm" />
      <ArchiveModal v-model:open="archiveModalOpen" :detail="formState" @success="getDetail" />
    </div>
  </a-watermark>
</template>

<script setup>
defineOptions({
  name: 'ContractLifecycleDetail',
})
import STATUS_SPZ from '@/assets/approval/spz.png'
import STATUS_YJJ from '@/assets/approval/yjj.png'
import STATUS_YDQ from '@/assets/approval/ydq.png'
import STATUS_YZZ from '@/assets/approval/yzz.png'
import STATUS_YBG from '@/assets/approval/ybg.png'
import STATUS_YXQ from '@/assets/approval/yxq.png'
import STATUS_YZF from '@/assets/approval/yzf.png'
import STATUS_WKS from '@/assets/approval/wks.png'
import STATUS_ZXZ from '@/assets/approval/zxz.png'
import { ref, computed, provide, onActivated, inject } from 'vue'
const PERM = inject('PERM')
import { message } from 'ant-design-vue'
import ContractDetailTabs from '../components/ContractDetailTabs.vue'
import ApprovalPassRejectModal from '@/components/system/ApprovalPassRejectModal.vue'
import ArchiveModal from './modals/ArchiveModal.vue'
import { getContractDetail, getContractProcessInstances, approveContract } from '@/api/Contract/lifecycle'
import useTabs from '@/hook/useTabs.js'
import { isJSON } from '@/utils/com.js'
import { formatDateTime } from '@/utils/com.js'
import { getTemplateCategoryList, mapIntentionContractDetailToFormValues } from '../hookMap.js'
const { toBack, route, router, toReplace, deptListMap, userInfos, findCurrentUserRunningTask } = useTabs({
  userType: true,
})

const borrowContracts = computed(() => {
  if (!userInfos.value?.borrowContracts) return {}
  let obj = userInfos.value?.borrowContracts?.reduce((acc, item) => {
    acc[item.contractId] = item
    return acc
  }, {})
  return obj || {}

})

const isBorrow = computed(() => {
  if (!formState.value.id || formState.value.canViewByUserPermission == 1) return null
  if (formState.value.handlerUserId == userInfos.value?.id) return null
  return borrowContracts.value?.[formState.value.id] || null
})

const borrowWatermarkContent = computed(() => {
  if (!isBorrow.value) return []
  const name = userInfos.value.username
  const timer = `${formatDateTime(new Date(), 'yyyy-MM-dd HH:mm:ss')} `
  return name ? [timer, name + '-合同借阅'] : ['借阅阅览']
})

const approvalActionModalOpen = ref(false)
const archiveModalOpen = ref(false)

const formState = ref({

})
const statusApprovalMap = {
  1: STATUS_SPZ,   // 审批中
  3: STATUS_YJJ,   // 已拒绝
  4: STATUS_YDQ,   // 已到期
  5: STATUS_YZZ,   // 已终止
  6: STATUS_YBG,   // 已变更
  7: STATUS_YXQ,   // 已续签
  8: STATUS_YZF,   // 已作废
  10: STATUS_WKS,  // 未开始
  11: STATUS_ZXZ,  // 执行中
}
const formComponents = ref({ YW: [], CW: [], })

let taskobj = ''
const handlePerm = computed(() => {
  if (!PERM('生命周期审批')) return false
  if (!formState.value.workflowForeData) return false
  const { processInstances } = formState.value.workflowForeData
  taskobj = findCurrentUserRunningTask(processInstances)
  return Boolean(taskobj?.taskId)
})
/** pass | reject */
const approvalActionType = ref('pass')
function openApprovalActionModal(type) {
  approvalActionType.value = type
  approvalActionModalOpen.value = true
}

async function handleApprovalConfirm(payload) {
  if (!taskobj?.taskId) return
  const { type, reason } = payload
  const res = await approveContract({
    id: route.query.id,
    taskId: taskobj.taskId,
    result: type === 'reject' ? 'refuse' : 'agree',
    remark: reason,
  })
  if (res.errno === 0) {
    if (type === 'reject') {
      message.success('审批已拒绝')
      handleClose()
      // getDetail()
    } else {
      message.success('审批已通过')
      handleClose()
      // getDetail()
    }
  }
}
const handleClose = () => {
  toBack()
}

function handleOpenArchive() {
  archiveModalOpen.value = true
}

function handleOpenChange() {
  toReplace('/contract/lifecycle/edit', { id: formState.value.id, type: 'change', mode: '变更合同' })
}
const loadFormComponentsByDingCode = async (dingProcessCode) => {
  if (!dingProcessCode) {
    formComponents.value = { YW: [], CW: [], otherVariableOptionsObj: {} }
    return
  }
  const { businessVariableOptions, financeVariableOptions, otherVariableOptionsObj } =
    await getTemplateCategoryList(
      { type: 1, dingProcessCode },
    )
  formComponents.value = {
    YW: businessVariableOptions ?? [],
    CW: financeVariableOptions ?? [],
    otherVariableOptionsObj: otherVariableOptionsObj ?? {},
  }
}

const getDetail = async () => {
  const res = await getContractDetail({ id: route.query.id })
  if (res.errno !== 0 || !res.data) return
  // const dingProcessCode = route.query.template || res.data.dingProcessCode
  // await loadFormComponentsByDingCode(dingProcessCode)
  let bodyJson = isJSON(res.data.bodyJson) ? JSON.parse(res.data.bodyJson) : {}
  let YW = bodyJson.YW?.formComponents || {}
  let CW = bodyJson.CW?.formComponents || {}
  formComponents.value = {
    YW: YW ?? [],
    CW: CW ?? [],
  };
  let row = mapIntentionContractDetailToFormValues(res.data)
  // const pi = await getContractProcessInstances({ id: res.data.id })
  formState.value = {
    id: res.data.id,
    canViewByUserPermission: res.data.canViewByUserPermission,
    handlerUserId: res.data.handlerUserId,
    contractNo: res.data.contractNo,
    ...row,
    handlerUserName: res.data.handlerUserName,
    handlerDeptName: res.data.handlerDeptName,
    participantRowsWF: row.participantRows.filter(item => item.role === 'our'),
    participantRowsDF: row.participantRows.filter(item => item.role === 'partner'),
    taxAmount: res.data.taxAmount,
    amountTaxExcluded: res.data.amountTaxExcluded,
    timer: `${formatDateTime(res.data.startDate, 'yyyy/MM/dd')} - ${formatDateTime(res.data.endDate, 'yyyy/MM/dd')} （${res.data.contractMonths}月）`,
    signDate: formatDateTime(res.data.signDate, 'yyyy/MM/dd'),
    workflowForeData: {
      workflowForecastNodes: res.data.forecastJson?.workflowForecastNodes,
      workflowActivityRules: res.data.forecastJson?.workflowActivityRules,
      processInstances: res.data.extJson,
      processHistories: res.data.processHistories,
    },
  }
}
onActivated(async () => {
  if (!route.query.id) return
  getDetail()
})
</script>
<style scoped lang="less">
.header-actions {
  position: absolute;
  top: -15px;
  right: 20vw;
  z-index: 999;

  img {
    width: 112px;
    height: 61px;
  }
}
</style>
