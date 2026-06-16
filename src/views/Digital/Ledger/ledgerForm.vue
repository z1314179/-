<template>
  <a-spin wrapperClassName="ledger-form" :spinning="loading" size="large">
    <div class="flex flex-column main-content">
      <div class="page-content flex-1">
        <a-form
          class="form-meta-form"
          layout="vertical"
          ref="formRef"
          :model="formState"
          :rules="formRules"
        >
          <a-card title="基本信息" :bordered="false" class="mg-t-small pd-b-0">
            <div class="flex flex-wrap gap-24" style="max-width: 1112px">
              <a-form-item label="资产名称" name="assetName">
                <a-input
                  v-model:value="formState.assetName"
                  :maxlength="200"
                  allow-clear
                  placeholder="请输入资产名称"
                  style="width: 260px"
                />
              </a-form-item>
              <a-form-item label="资产类型" name="assetType">
                <a-select
                  v-model:value="formState.assetType"
                  :options="assetTypeList.arr"
                  :filter-option="
                    (input, option) =>
                      option.label.toLowerCase().indexOf(input.toLowerCase()) >=
                      0
                  "
                  show-search
                  allow-clear
                  placeholder="请选择资产类型"
                  style="width: 260px"
                >
                </a-select>
              </a-form-item>
              <a-form-item label="资产编号" name="assetCode">
                <a-input
                  v-model:value="formState.assetCode"
                  :maxlength="200"
                  allow-clear
                  placeholder="请输入资产编号"
                  style="width: 260px"
                />
              </a-form-item>
              <a-form-item label="有效日期" name="startDate">
                <a-range-picker
                  v-model:value="formState.startDate"
                  :format="'YYYY-MM-DD'"
                  :value-format="'YYYY-MM-DD'"
                  allow-clear
                  style="width: 260px"
                />
              </a-form-item>
              <a-form-item label="所属公司" name="companyId">
                <a-select v-model:value="formState.companyId" :options="companyOptionList" :filter-option="(input, option) =>
                  option.companyName
                    .toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                  " :fieldNames="{ label: 'companyName', value: 'id' }" allow-clear show-search placeholder="请选择所属公司"
                  style="width: 260px">
                </a-select>
              </a-form-item>
              <a-form-item label="品牌" name="brandId">
                <a-select
                  v-model:value="formState.brandId"
                  :options="brandList"
                  :filter-option="
                    (input, option) =>
                      option.name.toLowerCase().indexOf(input.toLowerCase()) >=
                      0
                  "
                  :fieldNames="{ label: 'name', value: 'id' }"
                  allow-clear
                  show-search
                  placeholder="请选择品牌"
                  style="width: 260px"
                >
                </a-select>
              </a-form-item>
              <a-form-item label="经办部门" name="organizationId">
                <cascaderCheck
                  v-model:value="formState.organizationId"
                  :options="deptList"
                  :fieldNames="{
                    children: 'children',
                    label: 'name',
                    value: 'id',
                  }"
                  max-tag-count="responsive"
                  allow-clear
                  show-search
                  clearable
                  placeholder="请选择经办部门"
                  style="width: 260px"
                />
              </a-form-item>
              <a-form-item label="负责人" name="responseName">
                <a-input
                  v-model:value="formState.responseName"
                  :maxlength="200"
                  allow-clear
                  placeholder="请输入负责人"
                  style="width: 260px"
                />
              </a-form-item>
              <a-form-item label="联系方式" name="responseMobile">
                <a-input
                  v-model:value="formState.responseMobile"
                  :maxlength="200"
                  allow-clear
                  placeholder="请输入联系方式"
                  style="width: 260px"
                />
              </a-form-item>
            </div>
          </a-card>
          <a-card title="详情信息" :bordered="false" class="mg-t-small pd-b-0">
            <a-form-item label="资产描述" name="desc">
              <a-textarea
                v-model:value="formState.desc"
                :auto-size="{ minRows: 1 }"
                :maxlength="200"
                allow-clear
                placeholder="请输入资产描述"
                style="width: 1096px"
              />
            </a-form-item>
            <a-form-item label="备注" name="remark">
              <a-textarea
                v-model:value="formState.remark"
                :auto-size="{ minRows: 1 }"
                :maxlength="200"
                allow-clear
                placeholder="请输入备注"
                style="width: 1096px"
              />
            </a-form-item>
            <div style="max-width: 1096px" v-if="formComponents.YW?.length">
              <DingTemplateRenderer :subjectOptionList="companyOptionList" :schema-items="formComponents.YW" :local-form-data="formState.YW"
                :field-form-name="['YW']" />
            </div>
            <div style="max-width: 1310px" v-if="formComponents.CW?.length">
              <DingTemplateRenderer :subjectOptionList="companyOptionList" :schema-items="formComponents.CW" :local-form-data="formState.CW"
                :field-form-name="['CW']" />
            </div>
          </a-card>
          <a-card title="附件信息" :bordered="false" class="mg-t-small pd-b-0">
            <a-form-item label="附件上传" name="files">
              <a-upload
                action="#"
                :before-upload="customRequest"
                :show-upload-list="false"
                :accept="accept"
              >
                <a-button
                  type="primary"
                  ghost
                  style="margin-top: 4px"
                  class="shadow-btn iconfont icon-a-shangchuan3"
                >
                  上传附件
                </a-button>
              </a-upload>
              <div
                class="flex flex-wrap mg-t-small"
                v-if="formState.files.length"
              >
                <div
                  style="width: 367px"
                  class="flex mg-r-medium mg-y-small"
                  v-for="(item, index) in formState.files"
                  :key="index"
                >
                  <FileRowItem
                    class="flex-1"
                    style="min-width: 0"
                    :item="item.fileUrl"
                  >
                  </FileRowItem>
                  <div class="pd-l-medium flex align-center">
                    <i
                      v-if="Boolean(item.id)"
                      @click.stop="handleDownload(item.fileUrl)"
                      class="iconfont icon-xiazai"
                      style="color: rgba(0, 0, 0, 0.45)"
                    >
                    </i>
                    <i
                      @click.stop="formState.files.splice(index, 1)"
                      class="iconfont icon-guanbi1 mg-l-small"
                      style="font-size: 20px; color: rgba(0, 0, 0, 0.45)"
                    >
                    </i>
                  </div>
                </div>
              </div>
            </a-form-item>
          </a-card>
        </a-form>
      </div>
      <div class="page-content-footer">
        <a-popconfirm
          placement="top"
          ok-text="确定"
          cancel-text="取消"
          @confirm="handleCancel"
        >
          <template #title>
            <div>关闭后，当前页面后填写的内容将会被清空，请确认是否关闭？</div>
          </template>
          <a-button>关闭</a-button>
        </a-popconfirm>
        <a-button class="mg-l-small" @click="handleSave" type="primary">
          保存
        </a-button>
      </div>
    </div>
  </a-spin>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { message } from "ant-design-vue";
import { useRouter, useRoute } from "vue-router";
import { UploadOutlined } from "@ant-design/icons-vue";
import {
  getBrandList,
  getLedgerDetail,
  updateLedger,
  addLedger,
} from "@/api/Digital/ledger.js";
import { getTemplateDetail } from "@/api/Basic/template.js";
import { previewFile, downloadFile } from "@/utils/preview.js";
import cascaderCheck from "@/components/system/cascaderCheck.vue";
import FileRowItem from "@/components/upload/FileRowItem.vue";
import useTabs from "@/hook/useTabs.js";
import useUpload from "@/hook/useUpload.js";
import hookMap from "@/views/Digital/hookMap";
import DingTemplateRenderer from "@/components/DingTemplateRenderer/index.vue";
import {
  getTemplateCategoryList,
  getAssetContractData,
} from "@/views/Contract/contractProcessMap.js";

const { toBack, deptList, route } = useTabs({ dept: true });
const { companyListAll, assetTypeList } = hookMap({ isCompany: true });
const companyOptionList = computed(() => companyListAll.value?.arr ?? []);
const { uploadFile } = useUpload();

const router = useRouter();
const loading = ref(false);
const brandList = ref([]);
const templateInfo = ref({});
const accept = ".docx,.doc,.pdf,.txt";
const formComponents = ref({ YW: [], CW: [] });

let formData = {
  companyId: undefined,
  brandId: undefined,
  organizationId: undefined,
  assetName: undefined,
  assetType: undefined,
  assetCode: undefined,
  responseName: undefined,
  responseMobile: undefined,
  startDate: undefined,
  YW: {},
  CW: {},
  desc: "",
  remark: "",
  files: [],
};
const formState = ref({ ...formData });
const formRef = ref(null);
const formRules = ref({
  assetName: [
    {
      required: true,
      message: "请输入资产名称",
      trigger: "change",
    },
  ],
  assetType: [
    {
      required: true,
      message: "请选择资产类型",
      trigger: "change",
    },
  ],
  assetCode: [
    {
      required: true,
      message: "请输入资产编号",
      trigger: "change",
    },
  ],
  startDate: [
    {
      required: true,
      message: "请选择使用日期",
      trigger: "change",
    },
  ],
  companyId: [
    {
      required: true,
      message: "请选择所属公司",
      trigger: "change",
    },
  ],
  brandId: [
    {
      required: true,
      message: "请选择品牌",
      trigger: "change",
    },
  ],
  organizationId: [
    {
      required: true,
      message: "请选择经办部门",
      trigger: "change",
    },
  ],
});

const customRequest = async (file) => {
  const { data, name } = await uploadFile(file);
  formState.value.files.push({
    fileName: name,
    fileUrl: data,
  });
};

const handleDownload = (item) => {
  downloadFile(item);
};

const handleRemoveFileByIndex = (item, index) => {
  formState.value.files.splice(index, 1);
};

const toView = (item) => {
  const data = previewFile(item);
  if (data) {
    return message.warning(data);
  }
};

const apiFunctions = async (data) => {
  return route.query.id ? await updateLedger(data) : await addLedger(data);
};

const handleCancel = () => {
  toBack();
};

const buildParams = async () => {
  const params = {
    ...formState.value,
    startDate: formState.value.startDate[0],
    endDate: formState.value.startDate[1],
  };
  const { CW, YW, ...restParams } = params;
  restParams.formDataJson = JSON.stringify({
    YW: {
      formComponents: formComponents.value.YW,
      formValues: formState.value.YW,
    },
    CW: {
      formComponents: formComponents.value.CW,
      formValues: formState.value.CW,
    },
  });
  if (route.query.id) {
    restParams.id = route.query.id;
  }
  restParams.templateId = templateInfo.value.id;

  return restParams;
};

const handleSave = async () => {
  await formRef.value.validate();
  try {
    loading.value = true;
    const params = await buildParams();
    const res = await apiFunctions(params);
    loading.value = false;
    if (res.errno === 0) {
      message.success("保存成功");
      handleCancel();
    }
  } catch (error) {
    loading.value = false;
  }
};

const getTemplateDetailInfo = async () => {
  const { data } = await getTemplateDetail({ id: route.query.templateId });
  templateInfo.value = data;
  const { businessVariableOptions = [], financeVariableOptions = [] } =
    JSON.parse(templateInfo.value.templateContent) || {};
  formComponents.value = await getFormComponents(
    businessVariableOptions,
    financeVariableOptions,
  );
};

const getBrandData = async () => {
  const { data } = await getBrandList();
  brandList.value = data || [];
};

const getFormComponents = async (YW, CW) => {
  const business = getAssetContractData(YW, "YW");
  const finance = getAssetContractData(CW, "CW");
  return {
    YW: business,
    CW: finance,
  };
};

const getDetailsInfo = async () => {
  try {
    loading.value = true;
    const { data } = await getLedgerDetail({ id: route.query.id });
    const formDataJson = JSON.parse(data.formDataJson);
    formComponents.value = await getFormComponents(
      formDataJson.YW?.formComponents,
      formDataJson.CW?.formComponents,
    );
    for (let key in formState.value) {
      if (key === "startDate") {
        formState.value[key] = [data.startDate, data.endDate];
      } else if (key === "files") {
        formState.value[key] = JSON.parse(data.files || "[]").map(
          (item, index) => {
            return { ...item, id: index + 1 };
          },
        );
      } else if (key === "CW") {
        formState.value[key] = formDataJson.CW?.formValues || {};
      } else if (key === "YW") {
        formState.value[key] = formDataJson.YW?.formValues || {};
      } else {
        formState.value[key] = data[key] || formState.value[key];
      }
    }
    loading.value = false;
  } catch (error) {
    loading.value = false;
  }
};

onMounted(async () => {
  try {
    loading.value = true;
    await getBrandData();
    if (route.query.templateId) {
      await getTemplateDetailInfo();
    }
    if (route.query.id) {
      await getDetailsInfo();
    }

    loading.value = false;
  } catch (error) {
    loading.value = false;
  }
});
</script>

<style lang="scss" scoped>
.ledger-form {
  height: 100%;

  :deep(.ant-spin-container) {
    height: 100%;
  }

  .main-content {
    height: 100%;

    .page-content {
      height: auto;
      min-height: auto;
    }

    .ant-form-item {
      margin-bottom: 16px;
    }
  }

  .gap-24 {
    gap: 0 24px;
  }

  .gap-32 {
    gap: 16px 32px;
  }

  .pd-b-0 {
    :deep(.ant-card-body) {
      padding-bottom: 0px;
    }
  }
}
</style>
