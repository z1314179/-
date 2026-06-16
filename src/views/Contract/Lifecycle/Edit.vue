<template>
  <div class="intention-edit-page">
    <ContractIntentionEditContent ref="editContentRef" :form-values="formValues" :form-components="formComponents" />
    <div class="page-content-footer">
      <a-popconfirm class="mg-l-small" placement="topRight" ok-text="确定" cancel-text="取消" @confirm="handleCancel">
        <template #title>
          <div>关闭后，当前页面后填写的内容将会被清空，请确认是否关闭？</div>
        </template>
        <a-button>关闭</a-button>
      </a-popconfirm>
      <a-button type="default" v-if="PERM('生命周期编辑') || (!route.query.id && PERM('生命周期新增'))" class="mg-l-small"
        @click="submit(1)" :disabled="loading">保存</a-button>
      <a-button type="primary" v-if="PERM('生命周期编辑') || (!route.query.id && PERM('生命周期新增'))" class="mg-l-small"
        @click="submit(2)" :disabled="loading">提交</a-button>
    </div>
  </div>
</template>

<script setup>
defineOptions({
  name: "ContractEditPage",
});
import { message } from 'ant-design-vue'
import { ref, provide, onActivated, nextTick, inject } from "vue";
const PERM = inject('PERM')
import { addLog } from "@/api/record.js";
import ContractIntentionEditContent from "../components/ContractIntentionEditContent.vue";
import hookMap, {
  getTemplateCategoryList,
  mapIntentionContractDetailToFormValues,
  buildIntentionContractSubmitQuery,
  userInfo,
} from "../hookMap.js";
import { filterNames } from "../components/intentionEditFieldSchema.js";
import useContrast from "@/hook/business/useContrast.js";
import { contractStatusFn } from '@/utils/codeMap/basic.js'
import {
  getContractDetail,
  addContract,
  updateContract,
  submitContractToDing,
} from '@/api/Contract/lifecycle'
import { getIntentionContractDetail } from '@/api/Contract/intention.js'
import { postDingFile } from '@/api/Contract/intention.js'

const { toBack, route } = hookMap();
const { contractStatusObj, contractStatusList: contractStatusArr } = contractStatusFn()
provide('contractStatusList', { arr: contractStatusArr, obj: contractStatusObj })
provide('contractStatusObj', contractStatusObj)

const editContentRef = ref(null);
let requestQuery = {}

const {
  handleAlteration,
  updateAlteration,
  filterAlterationNames,
  handleAlterationArray,
} = useContrast()

const statusForSubmitLog = ref(null)

const formValues = ref({
  currency: 'CNY',
  attachments: [],
  budgetSplits: [{}],
  paymentPlans: [{}],
  participantRows: [{
    role: 'our',
  }, {
    role: 'partner',
  }],
  YW: {},
  CW: {},
});
const relationType = ref(1)
const formComponents = ref({ YW: [], CW: [], })
const loading = ref(false);
let diffDataObjStr = ''

const getDiffDataObj = () => {
  const { CW, YW } = updateAlteration.value
  let t_obj = {
    ...CW?.length ? CW[0] : {},
    ...YW?.length ? YW[0] : {}
  }
  let d_obj = {
    ...YW?.length ? YW[1] : {},
    ...CW?.length ? CW[1] : {}
  }
  const { diffData } = handleAlterationArray(t_obj, d_obj)
  let diffDataObj = filterAlterationNames(
    { ...updateAlteration.value, ...diffData },
    filterNames([...formComponents.value.YW, ...formComponents.value.CW])
  )
  return diffDataObj
}

const submit = async (val) => {
  const rawForm = await editContentRef.value?.getFormValues();
  if (!rawForm) return;
  loading.value = true
  if (route.query.id) {
    diffDataObjStr = getDiffDataObj()
  }
  const query = await buildIntentionContractSubmitQuery({
    rawForm,
    requestQuery,
    formComponents: formComponents.value,
    relationType: relationType.value,
  })
  if (query === -1) {
    loading.value = false
    message.error('模版内容不能为空')
    return
  }
  if (!query.id) {
    addContractApi(query, val)
  } else if (formValues.value.status == 3) {
    updateContractApi(query, val)
  } else if (route.query.mode === '续签合同' || route.query.mode === '变更合同') {
    delete query.id
    addContractApi(query, val)
  } else if (query.id) {
    updateContractApi(query, val)
  }
};
const addContractApi = async (query, val) => {
  try {
    const res = await addContract(query);
    loading.value = false
    if (res.errno === 0) {
      if (val === 2) {
        loading.value = true
        submitToDingApi(res.data)
      } else {
        toBack()
        message.success('保存成功')
      }
    }
    // if (formValues.value.status === 3) {
    //   addLog({
    //     objectIdArray: [requestQuery.id],
    //     module: 'intention',
    //     type: '合同修改',
    //     content: JSON.stringify(diffDataObjStr || {}),
    //   })
    // }
  } catch (error) {
    loading.value = false
    console.error(error)
  }
}
const updateContractApi = async (query, val) => {
  try {
    const res = await updateContract(query);
    loading.value = false
    if (res.errno === 0) {
      if (val === 2) {
        loading.value = true
        submitToDingApi(res.data)
      } else {
        toBack()
        message.success('保存成功')
      }
    }
  } catch (error) {
    loading.value = false
    console.error(error)
  }
}
const submitToDingApi = async (data) => {
  try {
    const res = await submitContractToDing({ id: data.id })
    loading.value = false
    if (res.errno === 0) {
      message.success('提交成功')
      toBack()
    }
  } catch (error) {
    loading.value = false
    console.error(error)
  }
}
function handleCancel() {
  toBack();
}
async function fillDefaultHandler() {

  if (!formValues.value.handlerUserId) {
    formValues.value.handlerUserId = userInfo.value.id
  };
  if (!formValues.value.handlerDeptId && userInfo.value.organizations) {
    formValues.value.handlerDeptId = userInfo.value.organizations.length > 0 ? userInfo.value.organizations[0].id : null
  }
}
const getTemplateDetails = async (id) => {

  const dingProcessCode = id;
  if (!dingProcessCode) return;
  loading.value = true;
  const { businessVariableOptions, financeVariableOptions, otherVariableOptionsObj } =
    await getTemplateCategoryList(
      { type: 1, dingProcessCode },
    );
  loading.value = false;
  formComponents.value = {
    YW: businessVariableOptions ?? [],
    CW: financeVariableOptions ?? [],
    otherVariableOptionsObj: otherVariableOptionsObj
  };
  await fillDefaultHandler()
};

const getIntentionContract = async () => {
  const res = await getIntentionContractDetail({ id: route.query.intentionId })
  if (res.errno === 0) {
    formValues.value = {
      ...mapIntentionContractDetailToFormValues(res.data),
      ...requestQuery
    }

    await getTemplateDetails(res.data.dingProcessCode)
    await nextTick()
    formValues.value.templateId = res.data.templateId
    statusForSubmitLog.value = formValues.value.status
    handleAlteration(formValues.value)
  }
}
const getContract = async () => {
  const res = await getContractDetail({ id: requestQuery.id })
  if (res.errno === 0) {
    requestQuery.fromIntentionContractId = res.data.sourceIntentionContractId
    formValues.value = {
      ...mapIntentionContractDetailToFormValues(res.data),
      ...requestQuery
    }
    if (formValues.value.status !== 3) {
      if (route.query.mode === '变更合同') {
        formValues.value.changeEffectiveDate = undefined
      }
      if (route.query.mode === '变更合同' || route.query.mode === '续签合同') {
        formValues.value.paymentPlans = Number(formValues.value.amountTaxIncluded) > 0 ? [{}] : []
        formValues.value.budgetSplits = Number(formValues.value.amountTaxIncluded) > 0 ? [{}] : []
        formValues.value.contracts = [{
          isAuto: 1,
          ...res.data
        }]
      }

    }

    await getTemplateDetails(res.data.dingProcessCode)
    await nextTick()
    formValues.value.templateId = res.data.templateId
    statusForSubmitLog.value = formValues.value.status
    handleAlteration(formValues.value)
  }
}
if (route.query.intentionId) {
  requestQuery.fromIntentionContractId = route.query.intentionId
  getIntentionContract()
} else if (route.query.id) {
  requestQuery.id = route.query.id
  //变更
  // requestQuery.sourceContractId = route.query.id
  getContract()
} else if (route.query.template) {
  requestQuery.templateId = route.query.templateId
  statusForSubmitLog.value = null
  getTemplateDetails(route.query.template)

}
onActivated(async () => {
  if (route.query.type === 'change') {
    relationType.value = 2
    requestQuery.sourceContractId = route.query.id
    requestQuery.contractType = 2
  } else if (route.query.type === 'renew') {
    relationType.value = 3
    requestQuery.sourceContractId = route.query.id
    requestQuery.contractType = 3
  } else {
    relationType.value = 1
    requestQuery.contractType = 1
  }
  requestQuery.intentionId = route.query.intentionId;
})

</script>

<style lang="scss" scoped>
.intention-edit-page {
  position: static;
}
</style>
