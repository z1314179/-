<template>
  <a-spin wrapperClassName="ledger-details" :spinning="loading" size="large">
    <div class="flex flex-column main-content">
      <div class="page-content flex-1">
        <a-form class="info_form" layout="vertical">
          <a-card title="基础信息" :bordered="false" class="card-pd-b-small">
            <div class="flex flex-wrap" style="max-width: 900px">
              <a-form-item label="资产名称">
                {{ detailsInfo.assetName || "-" }}
              </a-form-item>
              <a-form-item label="资产类型">
                {{ assetTypeList.obj[detailsInfo.assetType]?.label || "-" }}
              </a-form-item>
              <a-form-item label="资产编号">
                {{ detailsInfo.assetCode || "-" }}
              </a-form-item>
              <a-form-item label="有效日期">
                {{ `${detailsInfo.startDate} 至 ${detailsInfo.endDate}` }}
              </a-form-item>
              <a-form-item label="所属公司">
                {{ detailsInfo.company?.companyName || "-" }}
              </a-form-item>
              <a-form-item label="品牌">
                {{ detailsInfo.brand?.name || "-" }}
              </a-form-item>
              <a-form-item label="经办部门">
                {{ detailsInfo.organization?.name || "-" }}
              </a-form-item>
              <a-form-item label="负责人">
                {{ detailsInfo.responseName || "-" }}
              </a-form-item>
              <a-form-item label="联系电话" class="flex-1">
                {{ detailsInfo.responseMobile || "-" }}
              </a-form-item>
            </div>
          </a-card>
          <a-card
            title="详细信息"
            :bordered="false"
            class="mg-t-small card-pd-b-small"
          >
            <div class="flex flex-column" style="max-width: 900px">
              <a-form-item label="资产描述" class="flex-1 form-item">
                {{ detailsInfo.desc || "-" }}
              </a-form-item>
              <a-form-item label="备注" class="flex-1 form-item">
                {{ detailsInfo.remark || "-" }}
              </a-form-item>
            </div>

            <div
              class="flex flex-wrap"
              style="max-width: 900px"
              v-if="formComponents.YW.length"
            >
              <DingTemplateRenderer
                is-detail
                :schema-items="formComponents.YW"
                :local-form-data="formState.YW"
                :field-form-name="['YW']"
              />
            </div>
            <div
              class="flex flex-wrap modal-form-item"
              style="max-width: 1310px"
              v-if="formComponents.CW.length"
            >
              <DingTemplateRenderer
                is-detail
                :schema-items="formComponents.CW"
                :local-form-data="formState.CW"
                :field-form-name="['CW']"
              />
            </div>
          </a-card>
          <a-card title="附件信息" :bordered="false" class="mg-t-small">
            <div class="flex flex-wrap gap-32" v-if="detailsInfo.files?.length">
              <div
                v-for="(item, index) in detailsInfo.files"
                :key="index"
                class="file-item"
              >
                <FileRow :item="item.fileUrl" :showRemove="false" />
              </div>
            </div>
            <EmptyInfo v-else />
          </a-card>
        </a-form>
      </div>
      <div class="page-content-footer">
        <a-button @click="handleCancel">关闭</a-button>
      </div>
    </div>
  </a-spin>
</template>

<script setup>
import { ref, computed, onActivated } from "vue";
import { message } from "ant-design-vue";
import { useRoute, useRouter } from "vue-router";
import { getBrandList, getLedgerDetail } from "@/api/Digital/ledger.js";
import FileRow from "@/components/upload/FileRow.vue";
import EmptyInfo from "@/components/system/EmptyInfo.vue";
import useTabs from "@/hook/useTabs.js";
import SchemaForm from "@/components/system/SchemaForm.vue";
import hookMap from "@/views/Digital/hookMap";
import DingTemplateRenderer from "@/components/DingTemplateRenderer/index.vue";

const { toBack } = useTabs();
const { assetTypeList } = hookMap();

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const detailsInfo = ref({});
const formComponents = ref({ YW: [], CW: [] });
const formState = ref({ YW: {}, CW: {} });

const handleCancel = () => {
  toBack();
};

// const toView = (item) => {
//   const data = previewFile(item);
//   if (data) {
//     return message.warning(data);
//   }
// };

const getDetailsInfo = async () => {
  try {
    loading.value = true;
    const { data } = await getLedgerDetail({ id: route.query.id });
    data.files = JSON.parse(data.files);
    detailsInfo.value = data || {};
    const formDataJson = JSON.parse(data.formDataJson);
    formComponents.value = {
      YW: formDataJson.YW?.formComponents || [],
      CW: formDataJson.CW?.formComponents || [],
    };
    formState.value = {
      YW: formDataJson.YW?.formValues || {},
      CW: formDataJson.CW?.formValues || {},
    };
    loading.value = false;
  } catch (error) {
    loading.value = false;
  }
};

onActivated(async () => {
  try {
    loading.value = true;
    await getDetailsInfo();
    loading.value = false;
  } catch (error) {
    loading.value = false;
  }
});
</script>

<style lang="scss" scoped>
.ledger-details {
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
  }
  .info_form {
    :deep(.ant-form-item) {
      margin-right: 24px;
      .ant-form-item-row {
        width: 200px;
      }
    }
    :deep(.card-pd-b-small) {
      .ant-card-body {
        padding-bottom: 8px;
      }
    }
    .modal-form-item {
      :deep(.ant-table) {
        width: 1310px;
      }
    }
  }
  .gap-32 {
    gap: 16px 32px;
  }
  .form-item {
    :deep(.ant-form-item-row) {
      width: 100% !important;
    }
  }
  .file-item {
    :deep(.hover-text) {
      &:hover {
        color: rgba(0, 0, 0, 0.85);
        cursor: default;
      }
    }
  }
}
</style>
