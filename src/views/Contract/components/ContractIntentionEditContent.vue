<template>

  <div class="flex pd-x-large pd-y-medium">
    <EditNavSider class="mg-r-small" />
    <div class="edit-layout">
      <a-spin tip="加载中..." :spinning="loading">
        <a-form layout="vertical" ref="formRef" :model="formValues">
          <div id="section-doc" class="contract-anchor-sentinel" aria-hidden="true" />
          <a-card class="section-anchor" title="附件信息" :bordered="false">
            <div style="padding: 16px 24px 0">
              <a-form-item name="t_attachments" :autoLink="false"
                :rules="[{ validator: validateTAttachments, trigger: 'change' }]" class="mg-b-small"
                style="width: 100%">
                <template #label>
                  <span>合同文本</span>
                  <span class="mg-l-small" style="color: rgba(0, 0, 0, 0.65)">「合同文本支持在线解析」</span>
                </template>
                <a-input class="form-item-anchor-input" :value="formValues.t_attachments?.length ? '1' : ''" readonly
                  tabindex="-1" aria-hidden="true" />
                <a-form-item-rest>
                  <a-upload action="#" :before-upload="beforeUpload" :show-upload-list="false" :accept="accept">
                    <a-button type="primary" ghost style="margin-top: 4px"
                      class="shadow-btn iconfont icon-a-shangchuan3">
                      上传合同文本
                    </a-button>
                  </a-upload>
                  <div class="flex flex-wrap" v-if="formValues.t_attachments?.length">
                    <div class="flex mg-r-medium mg-t-small section-doc-item"
                      v-for="(item, index) in formValues.t_attachments" :key="index">
                      <FileRowItem isDownload class="flex-1" style="min-width: 0" :item="item.fileUrl">
                      </FileRowItem>
                      <span class="p-color cpr mg-l-small" @click="handleOnlineParse(item.fileUrl)">在线解析</span>
                    </div>
                  </div>
                  <div v-else style="
                  font-size: 12px;
                  margin-top: 2px;
                  color: rgba(0, 0, 0, 0.45);
                ">
                    支持.doc .docx .pdf.txt格式，单个文件不超过20MB，限上传 1 个文件
                  </div>
                </a-form-item-rest>
              </a-form-item>
              <div class="row-line mg-b-medium"></div>
              <a-form-item name="t_otherAttachments" class="mg-b-small" style="width: 100%">
                <template #label>
                  <span>其他附件</span>
                  <span class="mg-l-small" style="color: rgba(0, 0, 0, 0.65)">「不支持在线解析」</span>
                </template>
                <a-form-item-rest>
                  <a-upload action="#" :before-upload="beforeUploadOther" :show-upload-list="false" :accept="accept">
                    <a-button type="primary" ghost style="margin-top: 4px"
                      class="shadow-btn iconfont icon-a-shangchuan3">
                      上传附件
                    </a-button>
                  </a-upload>

                  <div class="flex flex-wrap" v-if="formValues.t_otherAttachments?.length">
                    <div class="mg-r-medium mg-t-small section-doc-item"
                      v-for="(item, index) in formValues.t_otherAttachments" :key="index">
                      <!-- <FileRow :item="item" @remove="handleRemoveFileByIndex" /> -->
                      <FileRowItem isDownload class="flex-1" style="min-width: 0" :item="item.fileUrl">
                        <template #right> </template>
                      </FileRowItem>
                      <i @click="clearContractFile(index)" class="iconfont icon-shanchu cpr mg-l-small"
                        style="font-size: 18px; color: #ee245e"></i>
                    </div>
                  </div>
                  <div v-else style="
                  font-size: 12px;
                  margin-top: 2px;
                  color: rgba(0, 0, 0, 0.45);
                ">
                    支持.doc .docx .pdf .txt格式，单个文件不超过20MB
                  </div>
                </a-form-item-rest>
              </a-form-item>
            </div>
            <!-- <div class="flex flex-wrap" style="padding: 8px 12px">
            <a-upload-dragger :show-upload-list="false" :before-upload="beforeUpload" :max-count="1"
              :disabled="uploading" :accept="accept">
              <span class="upload-title flex align-center p-color">
                <i class="iconfont icon-a-shangchuan3 mg-r-1" style="font-size: 17px"></i>
                上点击或将文件拖拽到这里上传</span>
              <span class="upload-desc">支持.doc .docx .pdf .txt格式，单个文件不超过20MB</span>
            </a-upload-dragger>
            <div v-for="(item, index) in formValues.attachments" :key="index" class="section-doc-item">
              <div class="flex align-center justify-between flex-1" style="min-width: 0;">
                <div class="flex mg-r-medium flex-1" style="min-width: 0;">
                  <div class="flex" style="max-width: 100%;">
                    <div :class="index == 0 ? 'flex-1 text-ellipsis' : ''"
                      v-for="(item, index) in fileNames(item.fileName)">
                      {{ item }}
                    </div>
                  </div>
                </div>
                <div class="flex align-center">
                  <span class="p-color cpr mg-r-1 " @click="handleOnlineParse(item.fileUrl)">在线解析</span>
                  <i @click="clearContractFile(index)" class="iconfont icon-shanchu cpr"
                    style="font-size: 20px;color: #EE245E"></i>
                </div>
              </div>
              <div class="desc">
                {{ item.fileSize }}MB
              </div>
            </div>
          </div> -->
          </a-card>
          <a-card class="mg-t-small" title="基础信息" id="section-base" :bordered="false">
            <div class="flex flex-wrap" style="max-width: 1136px">
              <IntentionBaseInfoSection :contractPropertyOptionsWithAll="contractPropertyOptionsWithAll"
                :categoryOptionsWithAll="categoryOptionsWithAll" :brandOptionsWithAll="brandOptionsWithAll"
                :subjectOptionsWithAll="subjectOptionsWithAll" :supplierOptionsWithAll="supplierOptionsWithAll"
                :userOptionsWithAll="userOptionsWithAll" :deptListOptions="deptListOptionsList"
                :deptListMap="deptListMap" :form-values="formValues" :form-state="formValues"
                @change="onParticipantPrincipalChange" />
            </div>
          </a-card>
          <a-card class="mg-t-small" title="业务信息" id="section-business" :bordered="false">
            <div v-if="formComponents.YW.length" class="flex flex-wrap" style="max-width: 1136px">
              <DingTemplateRenderer :schema-items="formComponents.YW" :local-form-data="formValues.YW"
                :field-form-name="['YW']" :subjectOptionList="subjectOptionList" />
            </div>
            <div class="row-line mg-b-medium" v-if="formComponents.YW.length"></div>

            <div class="flex align-center mg-b-medium" id="section-related">
              <span class="section_text_medium">关联合同</span>
            </div>
            <IntentionBusinessSection :brandOptionsWithAll="brandOptionsWithAll"
              :subjectOptionsWithAll="subjectOptionList" v-model:dataSource="formValues.contracts" />
          </a-card>
          <a-card class="mg-t-small" title="财务信息" id="section-finance" :bordered="false">
            <div>
              <div class="flex flex-wrap" style="max-width: 1136px" v-if="formComponents.CW.length">
                <DingTemplateRenderer :schema-items="formComponents.CW" :local-form-data="formValues.CW"
                  :field-form-name="['CW']" :subjectOptionList="subjectOptionList" />
              </div>
              <div class="row-line mg-b-medium" v-if="formComponents.CW.length"></div>
              <div class="flex flex-wrap" style="max-width: 1136px">
                <FinanceInfoFields :form-state="formValues" @change="onFinanceInfoChange" />
              </div>
              <div id="section-payment" v-if="formValues.amountTaxIncluded">
                <div class="row-line mg-b-medium"></div>
                <div class="flex align-center">
                  <span class="section_text_medium">收付计划</span>
                </div>
                <PaymentPlanTable ref="paymentPlanTableRef" :form-ref="formRef"
                  :supplierOptionsWithAll="supplierOptionsWithAll" :subjectOptionsWithAll="subjectOptionsWithAll"
                  class="mg-t-small" :form-state="formValues" />
              </div>
            </div>

            <div id="section-budget" v-if="formValues.amountTaxIncluded && String(formValues.isBudgetOccupied) === '1'">
              <div class="row-line mg-y-medium"></div>
              <div class="flex align-center">
                <span class="section_text_medium">预算分摊</span>
              </div>
              <BudgetSplitTable class="mg-t-medium" :deptListMap="deptListMap"
                :expenseTypeOptionsWithAll="expenseTypeOptionsWithAll" ref="budgetSplitTableRef" :form-ref="formRef"
                :form-state="formValues" :dept-list="deptList" />
            </div>
          </a-card>
          <a-card class="mg-t-small" title="补充条款" id="section-supplement" :bordered="false">
            <a-textarea placeholder="输入文本" v-model:value="formValues.supplementaryTerms" class="clause-textarea"
              :auto-size="{ minRows: 9 }" />
          </a-card>
          <a-card class="mg-t-small" title="违约条款" id="section-breach" :bordered="false">
            <a-textarea placeholder="输入文本" v-model:value="formValues.breachTerms" class="clause-textarea"
              :auto-size="{ minRows: 9 }" />
          </a-card>
        </a-form>
      </a-spin>
    </div>

    <a-card class="edit-layout-right" title="合同文档在线查看" :bordered="false">
      <template #extra>
        <div @click="previewContractFile" class="right-btn"
          :class="formValues.t_attachments?.length ? '' : 'right-btn-disabled'">
          一键填入
        </div>
      </template>

      <a-spin tip="加载中..." v-if="uploading" class="card-body-spin"> </a-spin>
      <div v-else class="right-content">
        <div class="mg-b-small" style="word-break: break-all" v-for="(item, key, index) in parsePreviewBlock"
          :key="index">
          "{{ key }}": "{{ item }}"
        </div>
      </div>
      <EmptyInfo v-if="isParsePreviewEmpty && !uploading" style="width: 100%">
        暂无内容
      </EmptyInfo>
    </a-card>
  </div>

</template>

<script setup>
defineOptions({ name: "ContractIntentionEditContent" });
import { ref, computed, nextTick, unref } from "vue";
import { message } from "ant-design-vue";
import EditNavSider from "./EditNavSider.vue";
import IntentionBusinessSection from "./IntentionBusinessSection.vue";
import FinanceInfoFields from "./FinanceInfoFields.vue";
import PaymentPlanTable from "./PaymentPlanTable.vue";
import BudgetSplitTable from "./BudgetSplitTable.vue";
import IntentionBaseInfoSection from "./IntentionBaseInfoSection.vue";
import SchemaForm from "@/components/system/SchemaForm.vue";
import DingTemplateRenderer from "@/components/DingTemplateRenderer/index.vue";
import FileRowItem from "@/components/upload/FileRowItem.vue";
import EmptyInfo from "@/components/system/EmptyInfo.vue";
import useUpload from "@/hook/useUpload.js";
import { formatDateTime } from "@/utils/com.js";
import hookMap from "../hookMap.js";
import { buildParseFieldMap } from "./intentionEditFieldSchema.js";
import { UploadOutlined, CloseCircleFilled } from "@ant-design/icons-vue";
const {
  categoryOptionsWithAll,
  contractPropertyOptionsWithAll,
  brandOptionsWithAll,
  subjectOptionsWithAll,
  supplierOptionsWithAll,
  userOptionsWithAll,
  expenseTypeOptionsWithAll,
  userInfo,
  deptListOptions,
  deptList,
  deptListMap,
} = hookMap([1, 2, 3, 4]);
const loading = ref(false);
const supplierOptionList = computed(() => supplierOptionsWithAll.value?.arr ?? []);
const userOptionList = computed(() => userOptionsWithAll.value?.arr ?? []);
const subjectOptionList = computed(() => subjectOptionsWithAll.value?.arr ?? []);
const accept = ".doc,.docx,.pdf,.txt";
const maxSize = 20;

const props = defineProps({
  formValues: {
    type: Object,
    required: true,
  },
  formComponents: {
    type: Object,
    required: true,
  },
});

const parsePreview = ref({
  data: {},
  fieldMap: {},
});
const deptListOptionsList = computed(() => {
  const deptId = props.formValues.handlerDeptId;
  if (!deptId) return deptListOptions.value;
  const obj = deptListOptions.value.find((item) => item.id === deptId);
  const arr = [...deptListOptions.value];
  if (!obj && deptId) {
    arr.unshift({
      name: props.formValues.handlerDeptName,
      id: deptId,
      hide: true,
    });
  }
  return arr;
});

const parsePreviewBlock = computed(() => {
  const p = parsePreview.value;
  if (!p || typeof p !== "object") return {};
  if (p.data !== undefined && p.data !== null && typeof p.data === "object")
    return p.data;
  const { fieldMap: _fm, ...rest } = p;
  return Object.keys(rest).length ? rest : {};
});

const isParsePreviewEmpty = computed(
  () => Object.keys(parsePreviewBlock.value).length === 0,
);

const uploading = ref(false);

const { uploadFile, fileNames } = useUpload();

const formRef = ref(null);
const paymentPlanTableRef = ref(null);
const budgetSplitTableRef = ref(null);

async function validateTAttachments(_rule, value) {
  const list = Array.isArray(value) ? value : props.formValues.t_attachments;
  if (!list?.length) {
    return Promise.reject("请上传合同文本");
  }
}

/** 校验失败滚动时，表单项距滚动容器顶部的留白（px） */

function onParticipantPrincipalChange() {
  nextTick(() => {
    paymentPlanTableRef.value?.syncPaymentPlansFromParticipants?.();
  });
}

const amountLinkedFields = ['paymentCondition', 'invoiceTitle', 'invoiceType']

function onIsBudgetOccupiedChange(val) {
  if (String(val) === '1') {
    const amount = Number(props.formValues.amountTaxIncluded) || 0
    if (amount > 0 && (!Array.isArray(props.formValues.budgetSplits) || !props.formValues.budgetSplits.length)) {
      props.formValues.budgetSplits = [{}]
    }
    return
  }
  props.formValues.budgetSplits = []
}

function onFinanceInfoChange(e) {
  if (e?.name === 'isBudgetOccupied') {
    onIsBudgetOccupiedChange(e.value)
    return
  }
  onContractAmountTaxIncludedChange()
}

function onContractAmountTaxIncludedChange() {
  const amount = Number(props.formValues.amountTaxIncluded) || 0
  if (amount === 0) {
    props.formValues.paymentPlans = []
    props.formValues.budgetSplits = []
    nextTick(() => {
      formRef.value?.clearValidate?.(amountLinkedFields)
    })
    return
  }
  nextTick(() => {
    paymentPlanTableRef.value?.syncAmountsByContractTotalFromRatios?.();
    budgetSplitTableRef.value?.syncBudgetAmountsByContractTotalFromRatios?.();
    formRef.value?.validateFields?.(amountLinkedFields).catch(() => { })
  })
}

function clearContractFile(index) {
  if (!Array.isArray(props.formValues.t_otherAttachments)) return;
  props.formValues.t_otherAttachments.splice(index, 1);
}

const fillFormValues = (val, form, key, filledKeys) => {
  if (val === null || val === undefined || val === "" || (val && val.length === 0)) return;
  form[key] = val;
  filledKeys.push(key);
}

async function previewContractFile() {
  if (loading.value) return;
  if (!props.formValues.t_attachments?.length) return;
  if (isParsePreviewEmpty.value) return message.warning('暂无内容');
  let fieldMap = parsePreview.value.fieldMap;
  if (!fieldMap || Object.keys(fieldMap).length === 0) return message.warning('正在解析中，请稍后再试');
  const filledKeys = [];
  for (const item of fieldMap.arr || []) {
    fillFormValues(item.value, props.formValues, item.key, filledKeys);
  }
  for (const item of fieldMap.obj?.YW || []) {
    if (props.formValues.YW) {
      fillFormValues(item.value, props.formValues.YW, item.key, filledKeys);
    }
  }
  for (const item of fieldMap.obj?.CW || []) {
    if (props.formValues.CW) {
      fillFormValues(item.value, props.formValues.CW, item.key, filledKeys);
    }
  }
  if (!filledKeys.length) return;
  await nextTick();
  if (filledKeys.includes("amountTaxIncluded")) {
    onContractAmountTaxIncludedChange();
  }
  formRef.value?.validateFields(filledKeys).catch(() => { });
}

async function handleOnlineParse(url) {

  try {
    uploading.value = true;
    const { useFileParse } = await import("@/hook/business/useFileParse.js");
    const { parseFile, parseFieldMap } = useFileParse();
    const parseFieldMapConfig = buildParseFieldMap(props.formComponents);
    const res = await parseFile({ url }, { fieldMap: parseFieldMapConfig });
    uploading.value = false;
    parsePreview.value.data = res.data || {};
    parsePreview.value.fieldMap = {}
    const fieldMap = await parseFieldMap(parsePreview.value.data, { fieldMap: parseFieldMapConfig });
    parsePreview.value.fieldMap = fieldMap;
  } catch (error) {
    console.log(error);

    uploading.value = false;
  }
}
const beforeUploadOther = async (file) => {
  return beforeUpload(file, 2);
};
async function beforeUpload(file, attachmentType = 1) {
  const res = await uploadFile(file, null, { types: accept, maxSize });
  let obj = {
    fileName: res.name,
    fileUrl: res.data,
    uploadTime: formatDateTime(new Date().getTime(), "yyyy-MM-dd HH:mm:ss"),
    fileSize: res.size,
    file: res.file,
  };
  if (attachmentType == 2) {
    obj.attachmentType = 2;
    if (!Array.isArray(props.formValues.t_otherAttachments)) {
      props.formValues.t_otherAttachments = [];
    }
    props.formValues.t_otherAttachments.push(obj);
  } else {
    obj.attachmentType = 1;
    props.formValues.t_attachments = [obj];
    await nextTick();
    formRef.value?.validateFields(["t_attachments"]).catch(() => { });
  }
  message.success("上传成功");
  return false;
}
const getFormValues = async () => {
  try {
    await formRef.value?.validate();
  } catch (error) {
    const errorFields = error?.errorFields || [];
    if (errorFields.length) {
      message.warning(errorFields[0].errors[0] || '此为必填项');
      formRef.value?.scrollToField(errorFields[0].name, {
        behavior: "smooth",
        block: "start",
      });
    }
    return false;
  }
  const partnersWithoutBank = (props.formValues.participantRows || []).filter(
    (r) => r.role === "partner" && !r.bankInfo?.id,
  );
  if (partnersWithoutBank.length) {
    message.warning("请为对方客商设置银行账户信息");
    return false;
  }
  const paymentLeft =
    unref(paymentPlanTableRef.value?.amountUnallocatedNum) ?? 0;
  const budgetLeft =
    unref(budgetSplitTableRef.value?.amountUnallocatedNum) ?? 0;
  if (paymentLeft > 0) {
    message.warning("请核对收付计划已创建金额");
    return false;
  }
  if (budgetLeft > 0 && String(props.formValues.isBudgetOccupied) === '1') {
    message.warning("请核对预算分摊已创建金额");
    return false;
  }
  if (String(props.formValues.isBudgetOccupied) !== '1') {
    props.formValues.budgetSplits = []
  }
  return props.formValues;
};

defineExpose({
  getFormValues,
});
</script>

<style lang="scss" scoped>
.card-body-spin {
  position: absolute;
  top: 30vh;
  left: 50%;
  transform: translateX(-50%);
  z-index: 999;
}

.ant-spin-nested-loading {
  width: 100%;
  height: 100%;
}

.edit-layout-right {
  position: sticky;
  top: 16px;
  right: 0;
  height: calc(100vh - 188px);
  width: 400px;
  background-color: #fff;
  margin-left: 8px;

  :deep(.ant-card-body) {
    overflow-y: auto;
  }



  .right-btn {
    border-radius: 3px;
    background: #00a870;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.9);
    padding: 2px 8px;
    cursor: pointer;

    &.right-btn-disabled {
      background: rgba(0, 168, 112, 0.5);
      color: rgba(255, 255, 255, 0.9);
      cursor: not-allowed;
    }
  }
}

.edit-layout {
  flex: 1;
  display: flex;
  min-width: 0;
  position: relative;

  .ant-form {
    width: 100%;
  }

  .contract-anchor-sentinel {
    height: 0;
    width: 100%;
    overflow: hidden;
    pointer-events: none;
  }

  :deep(.section-anchor) {
    // position: sticky;
    // top: 0;
    // z-index: 1000;

    .ant-card-body {
      padding: 0;
    }
  }

  .section-doc-item {
    width: 400px;
    padding: 6px 12px;
    background: rgba(0, 0, 0, 0.02);
    border-radius: 4px;
    margin-right: 12px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .desc {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.45);
    }
  }

  // :deep(.contract-anchor-sentinel + .section-anchor) {
  //   .ant-upload-drag {
  //     width: 400px;
  //     padding: 10px;
  //     background: #fafbff;
  //     border-radius: 4px;
  //     height: 68px;
  //     margin: 8px 12px;
  //     box-sizing: border-box;
  //     border-color: #cbe1ff;

  //     .ant-upload {
  //       padding: 0;
  //       display: flex;
  //       flex-direction: column;
  //       align-items: center;
  //       justify-content: center;

  //       .upload-desc {
  //         margin-top: 4px;
  //         font-size: 12px;
  //         color: rgba(0, 0, 0, 0.45);
  //       }
  //     }
  //   }

  // }
}

.row-line {
  width: 100%;
  height: 1px;
  background-color: rgba(0, 0, 0, 0.06);
}

.section__bar {
  width: 6px;
  height: 16px;
  background: var(--color-primary);
  margin-right: 4px;
}

.section__text {
  font-weight: 500;
  font-size: 16px;
}

:deep(.ant-table) {
  .ant-form-item {
    margin-bottom: 0px;
    margin-right: 0px;

    .ant-form-item-row {
      width: 100% !important;
    }
  }
}

:deep(.ant-form-item) {
  scroll-margin-top: var(--form-validate-scroll-offset, 88px);
  margin-bottom: 16px;
  margin-right: 24px;

  &.mg-b-0 {
    margin-bottom: 0;
  }

  .ant-form-item-row {
    width: 260px;
  }

  .ant-form-item-control-input-content {

    .ant-input-affix-wrapper,
    .ant-select,
    .ant-picker,
    .ant-picker-range,
    .ant-input-number,
    >.ant-input {
      width: 100% !important;
    }
  }
}

.form-item-anchor-input {
  position: absolute;
  width: 0;
  height: 0;
  padding: 0;
  border: 0;
  opacity: 0;
  pointer-events: none;
}
</style>
