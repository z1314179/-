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
      <a-button type="default" v-if="PERM('意向合同编辑') || (!route.query.id && PERM('意向合同新增'))" class="mg-l-small"
        @click="submit(1)" :disabled="loading">保存</a-button>
      <a-button type="primary" v-if="PERM('意向合同编辑') || (!route.query.id && PERM('意向合同新增'))" class="mg-l-small"
        @click="submit(2)" :disabled="loading">提交</a-button>
    </div>
  </div>
</template>

<script setup>
defineOptions({
  name: "ContractIntentionEditPage",
});
import { message } from 'ant-design-vue'
import { ref, onActivated, nextTick, inject } from "vue";
const PERM = inject('PERM')
import { addLog } from "@/api/record.js";
import ContractIntentionEditContent from "../components/ContractIntentionEditContent.vue";
import hookMap, {
  getTemplateCategoryList,
  mapIntentionContractDetailToFormValues,
  buildIntentionContractSubmitQuery,
  userOptionsWithAll,
  userInfo
} from "../hookMap.js";
import { filterNames, filterNamesByFilds } from "../components/intentionEditFieldSchema.js";
import useContrast from "@/hook/business/useContrast.js";
import interfaceStore from "@/store/interface.js";
import { getTableList } from "@/api/users.js";
const { toBack, route } = hookMap();
import {
  createIntentionContract,
  getIntentionContractDetail,
  postDingFile,
  updateIntentionContract,
  submitToDing
} from "@/api/Contract/intention.js";
import { isJSON } from "@/utils/com.js";
const editContentRef = ref(null);
let requestQuery = {}
let forminfo = {}
const { handleAlteration,
  updateAlteration,
  filterAlterationNames,
  handleAlterationArray
} = useContrast()

const formValues = ref({
  currency: 'CNY',
  isBudgetOccupied: '0',
  attachments: [],
  t_attachments: [],
  t_otherAttachments: [],
  budgetSplits: [],
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
const toFormDataValue = (value) => {
  let values = isJSON(value) ? JSON.parse(value) : value
  if (Array.isArray(values)) {
    values = values.map(item => {
      if (Array.isArray(item)) {
        return item.map(item => {
          let str = item.name + ':'
          if (Array.isArray(item.value)) {
            str += item.value.join('、')
          } else {
            str += item.value
          }
          return str
        })
      } else {
        return item
      }
    })
    return values
  } else {
    return values
  }

}
const toFormDataJsonArray = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string" && isJSON(raw)) {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  }
  return [];
};

const getDiffDataObj = (query) => {
  let excludeKeys = ['关联合同', '合同附件']
  let tt_obj = toFormDataJsonArray(forminfo.formDataJson).reduce((acc, curr) => {
    if (excludeKeys.includes(curr.name)) return acc
    acc[curr.name] = toFormDataValue(curr.value)
    return acc
  }, {})
  let dd_obj = toFormDataJsonArray(query.formDataJson).reduce((acc, curr) => {
    if (excludeKeys.includes(curr.name)) return acc
    acc[curr.name] = toFormDataValue(curr.value)
    return acc
  }, {})
  let t_obj = {
    ...tt_obj
  }
  let d_obj = {
    ...dd_obj
  }
  const { diffData } = handleAlterationArray(t_obj, d_obj)
  let updateObj = {
    ...updateAlteration.value
  }
  delete updateObj.CW
  delete updateObj.YW
  let diffDataObj = filterAlterationNames(
    updateObj,
    filterNames()
  )
  return { ...diffDataObj, ...diffData }
}
const submit = async (val) => {
  const rawForm = await editContentRef.value?.getFormValues();
  if (!rawForm) return;
  loading.value = true

  const query = await buildIntentionContractSubmitQuery({
    rawForm,
    requestQuery,
    formComponents: formComponents.value,
    relationType: relationType.value,
  })
  if (query === -1) {
    loading.value = false
    message.warning('模版内容不能为空')
    return
  }
  if (route.query.id) {
    diffDataObjStr = getDiffDataObj(query)
  }

  if (!query.id || formValues.value.status === 3) {
    if (formValues.value.status === 3) {
      query.rootContractId = formValues.value.rootContractId
    }
    const res = await createIntentionContract(query);
    loading.value = false
    if (res.errno === 0) {
      if (val === 2) {
        loading.value = true
        submitToDingApi(res.data)
      } else {
        toBack()
        message.success('保存成功')
      }
      if (formValues.value.status === 3) {
        addLog({
          objectIdArray: [requestQuery.id],
          module: 'intention',
          type: '意向合同修改',
          content: JSON.stringify(diffDataObjStr || {}),
        })
      }
    }

  } else {
    const res = await updateIntentionContract(query);
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

  }

};

const submitToDingApi = async (data) => {
  const res = await submitToDing({ id: data.id })
  loading.value = false
  if (res.errno === 0) {
    message.success('提交成功')
    toBack()
  }
}
function handleCancel() {
  toBack();
}

async function ensureUserOptions() {
  if (userOptionsWithAll.value?.arr?.length) return;
  const { data } = await getTableList({ isAll: 1 });
  const list = data ?? [];
  userOptionsWithAll.value = {
    arr: list,
    obj: list.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {}),
  };
}

async function fillDefaultHandler() {

  if (!formValues.value.handlerUserId) {
    formValues.value.handlerUserId = userInfo.value.id
  };

  if (!formValues.value.handlerDeptId && userInfo.value.organizations) {
    formValues.value.handlerDeptId = userInfo.value.organizations.length > 0 ? userInfo.value.organizations[0].id : null
  }
}

const getTemplateDetails = async () => {
  const dingProcessCode = requestQuery.template;
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
  await fillDefaultHandler();
};

const getinfo = async () => {
  const res = await getIntentionContractDetail({ id: route.query.id })
  if (res.errno === 0) {
    forminfo = JSON.parse(JSON.stringify(res.data));
    formValues.value = {
      ...mapIntentionContractDetailToFormValues(res.data),
      ...requestQuery
    }
    await nextTick();
    handleAlteration(formValues.value);

  }
}
if (route.query.id) {
  requestQuery.id = route.query.id
  getinfo()
}
onActivated(async () => {
  relationType.value = 1
  requestQuery.templateId = route.query.templateId;
  requestQuery.template = route.query.template;
  await getTemplateDetails()

})

</script>

<style lang="scss" scoped>
.intention-edit-page {
  position: static;
}
</style>
