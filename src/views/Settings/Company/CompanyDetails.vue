<template>
  <a-spin wrapperClassName="company-details" :spinning="loading" size="large">
    <div class="flex flex-column main-content">
      <div class="page-content flex-1">
        <a-form class="info_form">
          <a-card title="基本信息" :bordered="false" class="card-pd-b-small">
            <div class="flex flex-wrap" style="max-width: 1110px">
              <a-form-item label="公司编码">
                {{ detailsInfo.companyCode || "-" }}
              </a-form-item>
              <a-form-item label="公司名称">
                {{ detailsInfo.companyName || "-" }}
              </a-form-item>
              <a-form-item label="公司法人">
                {{ detailsInfo.legalPerson || "-" }}
              </a-form-item>
              <a-form-item label="上级公司" class="w-full">
                {{ detailsInfo.parentCompany?.companyName || "-" }}
              </a-form-item>
              <a-form-item label="注册地址" class="w-full">
                {{
                  formatAddress(
                    detailsInfo.registeProvince,
                    detailsInfo.registeCity,
                    detailsInfo.registAddress,
                  )
                }}
              </a-form-item>
              <a-form-item label="描述" class="w-full">
                {{ detailsInfo.remark || "-" }}
              </a-form-item>
            </div>
          </a-card>
          <a-card
            title="银行账户信息"
            :bordered="false"
            class="card_table mg-t-small"
          >
            <div class="flex flex-wrap" style="max-width: 1300px">
              <a-table
                bordered
                row-key="id"
                :pagination="false"
                :columns="columns"
                :data-source="detailsInfo.companyAccounts"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.dataIndex === 'accountName'">
                    <a-tooltip :title="record.accountName">
                      <span>
                        {{ record.accountName }}
                      </span>
                    </a-tooltip>
                  </template>
                  <template v-if="column.dataIndex === 'accountNumber'">
                    <a-tooltip :title="record.accountNumber">
                      <span>
                        {{ record.accountNumber }}
                      </span>
                    </a-tooltip>
                  </template>
                  <template v-if="column.dataIndex === 'accountOpenBranch'">
                    <a-tooltip :title="record.accountOpenBranch">
                      <span>
                        {{ record.accountOpenBranch }}
                      </span>
                    </a-tooltip>
                  </template>
                  <template v-if="column.dataIndex === 'remark'">
                    <a-tooltip :title="record.remark" v-if="record.remark">
                      <span>
                        {{ record.remark }}
                      </span>
                    </a-tooltip>
                    <span v-else>-</span>
                  </template>
                </template>
              </a-table>
            </div>
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
import { ref, onActivated } from "vue";
import { useRoute } from "vue-router";
import { getCompanyDetail } from "@/api/Settings/company.js";
import useTabs from "@/hook/useTabs.js";

const { toBack } = useTabs();
const route = useRoute();

const loading = ref(false);
const detailsInfo = ref({});

const handleCancel = () => {
  toBack();
};

const formatAddress = (province, city, detailAddress = "") => {
  const parts = [province, city, detailAddress].filter(Boolean);
  return parts.join("") || "-";
};

const getDetailsInfo = async () => {
  try {
    loading.value = true;
    const { data } = await getCompanyDetail({ id: route.query.id });
    detailsInfo.value = data || {};
    loading.value = false;
  } catch (error) {
    loading.value = false;
  }
};

onActivated(async () => {
  await getDetailsInfo();
});

const columns = [
  {
    title: "账户类型",
    dataIndex: "accountType",
    key: "accountType",
    width: 200,
    customRender: ({ record }) =>
      record.accountType === 1 ? "基本账户" : "一般账户",
  },
  {
    title: "账户名称",
    dataIndex: "accountName",
    key: "accountName",
    width: 200,
    ellipsis: true,
  },
  {
    title: "银行账号",
    dataIndex: "accountNumber",
    key: "accountNumber",
    width: 200,
    ellipsis: true,
  },
  {
    title: "开户银行",
    dataIndex: "accountOpen",
    key: "accountOpen",
    width: 200,
  },
  {
    title: "开户支行",
    dataIndex: "accountOpenBranch",
    key: "accountOpenBranch",
    width: 200,
    ellipsis: true,
  },
  {
    title: "备注",
    dataIndex: "remark",
    key: "remark",
    width: 200,
    ellipsis: true,
  },
  {
    title: "默认账户",
    dataIndex: "isDefault",
    key: "isDefault",
    width: 80,
    customRender: ({ record }) => (record.isDefault === 1 ? "是" : "否"),
  },
];
</script>

<style lang="scss" scoped>
.company-details {
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
      margin-right: 80px;
      width: 290px;
      &.w-full {
        width: 100%;
      }
    }
    :deep(.card-pd-b-small) {
      .ant-card-body {
        padding-bottom: 8px;
      }
    }
  }
  :deep(.card_table) {
    padding: 0px;
    .ant-card-body {
      padding: 16px 24px;
    }
    .radio_def {
      display: inline-block;
      &.radio_def_true {
        width: 16px;
        height: 16px;
        background: #ffffff;
        border-radius: 8px;
        border: 1px solid #1677ff;
        position: relative;
        &::before {
          content: "";
          width: 8px;
          height: 8px;
          background: #1677ff;
          border-radius: 50%;
          position: absolute;
          left: 3px;
          top: 3px;
        }
      }
    }
  }
}
</style>
