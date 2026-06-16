<template>
  <div>
    <ContractDetailTabs :deptListMap="deptListMap" :form-state="formState" :form-components="formComponents">
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
      </template>
    </ContractDetailTabs>

    <ApprovalPassRejectModal v-model:open="approvalActionModalOpen" :type="approvalActionType"
      @confirm="handleApprovalConfirm" />
  </div>
</template>

<script setup>
defineOptions({
  name: 'IntentionDetail',
})
import STATUS_1 from '@/assets/approval/spz.png'
import STATUS_2 from '@/assets/approval/ytg.png'
import STATUS_3 from '@/assets/approval/yjj.png'
import { ref, computed, provide, onActivated, inject } from 'vue'
const PERM = inject('PERM')
import { message } from 'ant-design-vue'
import ContractDetailTabs from '../components/ContractDetailTabs.vue'
import ApprovalPassRejectModal from '@/components/system/ApprovalPassRejectModal.vue'
import { getIntentionContractDetail, getProcessInstances, approveContract } from '@/api/Contract/intention'
import useTabs from '@/hook/useTabs.js'
import { getTemplateCategoryList, mapIntentionContractDetailToFormValues } from '../hookMap.js'
import { isJSON } from '@/utils/com.js'
const { toBack, route, deptListMap, findCurrentUserRunningTask } = useTabs({
  userType: true,
})
const approvalActionModalOpen = ref(false)
import { formatDateTime } from '@/utils/com.js'
const formState = ref({

})
const statusApprovalMap = {
  1: STATUS_1,
  2: STATUS_2,
  3: STATUS_3,
}
const formComponents = ref({ YW: [], CW: [], })
let taskobj = ''
const handlePerm = computed(() => {
  if (!PERM('意向合同审批')) return false
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
    remark: reason
  })
  if (res.errno === 0) {
    if (type === 'reject') {
      message.success('已提交拒绝')
      handleClose()
    } else {
      message.success('已提交通过')
      handleClose()
    }
  }

  // 提交审批接口时使用完整 payload：{ type, reason }（通过时 reason 可为空）
}
const handleClose = () => {
  toBack()
}
const getTemplateDetails = async () => {

  const dingProcessCode = route.query.template;
  if (!dingProcessCode) return;
  const { businessVariableOptions, financeVariableOptions } =
    await getTemplateCategoryList(
      { type: 1, dingProcessCode },
    );
  formComponents.value = {
    YW: businessVariableOptions ?? [],
    CW: financeVariableOptions ?? [],
  };

};

const getDetail = async () => {
  const res = await getIntentionContractDetail({ id: route.query.id })
  if (res.errno !== 0 || !res.data) return
  let row = mapIntentionContractDetailToFormValues(res.data)
  // const pi = await getProcessInstances({ id: res.data.id })
  // const processInstances = pi?.errno === 0 ? pi.data : res.data.extJon
  let bodyJson = isJSON(res.data.bodyJson) ? JSON.parse(res.data.bodyJson) : {}
  let YW = bodyJson.YW?.formComponents || {}
  let CW = bodyJson.CW?.formComponents || {}
  formComponents.value = {
    YW: YW ?? [],
    CW: CW ?? [],
  };
  formState.value = {
    id: res.data.id,
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
      processInstances: res.data.extJson
    },
  }
}
onActivated(async () => {
  if (!route.query.id) return
  // getTemplateDetails()
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