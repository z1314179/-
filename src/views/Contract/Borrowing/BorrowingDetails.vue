<template>
  <a-spin wrapperClassName="borrowing-details" :spinning="loading" size="large">
    <div class="flex flex-column main-content">
      <div class="page-content flex-1">
        <a-form class="info_form" layout="vertical">
          <a-card title="借阅信息" :bordered="false" class="card-pd-b-small">
            <div class="flex flex-wrap" style="max-width: 900px">
              <a-form-item label="借阅人">
                {{ detailsInfo.applicantUserName || "-" }}
              </a-form-item>
              <a-form-item label="借阅日期">
                {{ detailsInfo.borrowDate?.split(" ")[0] || "-" }}
              </a-form-item>
              <a-form-item label="借阅起止日期">
                {{
                  `${detailsInfo.borrowStartDate} 至 ${detailsInfo.borrowEndDate}`
                }}
              </a-form-item>
              <a-form-item label="借阅状态">
                <span
                  class="tag_base_dddddddd"
                  :class="borrowStatusList.obj[detailsInfo.borrowStatus]?.class"
                >
                  {{ borrowStatusList.obj[detailsInfo.borrowStatus]?.label }}
                </span>
              </a-form-item>
              <a-form-item label="借阅原因" class="flex-1">
                {{ detailsInfo.borrowReason || "-" }}
              </a-form-item>
            </div>
          </a-card>
          <a-card
            title="借阅数据"
            :bordered="false"
            class="card_table mg-t-small"
          >
            <div class="flex" style="max-width: 1300px; max-height: 800px">
              <a-table
                bordered
                row-key="id"
                :columns="columns"
                :data-source="dataSource"
                :loading="loadTable"
                :pagination="searchQuery"
                @change="handleTableChange"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.dataIndex === 'contractName'">
                    <a-tooltip :title="record.contractName">
                      <span>
                        {{ record.contractName }}
                      </span>
                    </a-tooltip>
                  </template>
                  <template v-if="column.dataIndex === 'brandName'">
                    <a-tooltip :title="record.brandName">
                      <span>
                        {{ record.brandName }}
                      </span>
                    </a-tooltip>
                  </template>
                  <template v-if="column.dataIndex === 'contractNo'">
                    <a-tooltip :title="record.contractNo">
                      <a-button
                        type="link"
                        class="oper-link pd-l-small"
                        @click="
                          toRouterQuery('/contract/lifecycle/detail', {
                            id: record.id,
                          })
                        "
                      >
                        {{ record.contractNo }}
                      </a-button>
                    </a-tooltip>
                  </template>
                  <template v-if="column.dataIndex === 'ourCompanyName'">
                    <a-tooltip :title="record.ourCompanyName.join('\n')">
                      <span>
                        {{ record.ourCompanyName.join("\n") }}
                      </span>
                    </a-tooltip>
                  </template>
                  <template v-if="column.dataIndex === 'counterpartyName'">
                    <a-tooltip :title="record.counterpartyName.join('\n')">
                      <span>
                        {{ record.counterpartyName.join("、") }}
                      </span>
                    </a-tooltip>
                  </template>
                </template>
              </a-table>
            </div>
          </a-card>
          <a-card title="借阅用途" :bordered="false" class="mg-t-small pd-b-0">
            <a-checkbox-group
              v-model:value="detailsInfo.purposeArray"
              :options="purposeOptions"
              class="purpose-checkbox-group"
              disabled
            />
          </a-card>

          <a-card
            title="审批详情"
            :bordered="false"
            class="card_table mg-t-small"
            v-if="detailsInfo.borrowStatus !== 1"
          >
            <div style="max-width: 1300px">
              <ApprovalDetailTimeline :workflow-fore-data="workflowForeData" />
            </div>
          </a-card>
        </a-form>
      </div>
      <div class="page-content-footer">
        <a-button @click="handleCancel">关闭</a-button>
        <template
          v-if="
            detailsInfo.borrowStatus === 2 && handlePerm && PERM('合同借阅审批')
          "
        >
          <a-button
            class="mg-l-small"
            type="primary"
            ghost
            danger
            @click="handleApprove('refuse')"
          >
            拒绝
          </a-button>
          <a-button
            class="mg-l-small"
            type="primary"
            @click="handleApprove('agree')"
          >
            同意
          </a-button>
        </template>
      </div>
    </div>
  </a-spin>
  <ApproveModal
    v-model:open="openState"
    :type="openType"
    :id="route.query.id"
    @change="getDetailsInfo"
  />
</template>

<script setup>
import { ref, computed, onActivated, inject } from "vue";
import { message } from "ant-design-vue";
import { useRoute, useRouter } from "vue-router";
import { getBorrowingDetail } from "@/api/Contract/borrowing.js";
import {
  ClockCircleFilled,
  CloseCircleFilled,
  CheckCircleFilled,
} from "@ant-design/icons-vue";
import ApproveModal from "./modals/ApproveModal.vue";
import useTabs from "@/hook/useTabs.js";
import useTable from "@/hook/useTable.js";
import hookMap from "@/views/Contract/hookMap";
import ApprovalDetailTimeline from "@/views/Contract/components/ApprovalDetailTimeline.vue";

const { borrowStatusList } = hookMap();

const { toBack, findCurrentUserRunningTask } = useTabs({ userType: true });

const PERM = inject("PERM");
const route = useRoute();
const router = useRouter();
const loading = ref(false);
const detailsInfo = ref({});
const openState = ref(false);
const openType = ref("");
const approvalRecords = ref([{}]);

const workflowForeData = computed(() => ({
  workflowForecastNodes: detailsInfo.value?.forecastJson?.workflowForecastNodes,
  workflowActivityRules: detailsInfo.value?.forecastJson?.workflowActivityRules,
  processInstances: detailsInfo.value?.extJson,
  processHistories: detailsInfo.value?.processHistories,
}));

let taskobj = "";
const handlePerm = computed(() => {
  if (!workflowForeData.value) return false;
  const { processInstances } = workflowForeData.value;
  taskobj = findCurrentUserRunningTask(processInstances);
  return Boolean(taskobj?.taskId);
});

const purposeOptions = [
  { label: "在线查看", value: 1 },
  { label: "下载附件", value: 2 },
];

const approveStatus = {
  NONE: { label: "审批中", class: "color_spz" },
  REFUSE: { label: "审批拒绝", class: "color_jj" },
  AGREE: { label: "审批通过", class: "color_ty" },
};

const handleApprove = async (type) => {
  openType.value = type;
  openState.value = true;
};

const handleCancel = () => {
  toBack();
};

const getDetailsInfo = async () => {
  try {
    loading.value = true;
    const { data } = await getBorrowingDetail({ id: route.query.id });
    detailsInfo.value = data || {};
    loading.value = false;
  } catch (error) {
    loading.value = false;
  }
};

const getApi = async (query) => {
  const { details } = detailsInfo.value;
  const title = details?.length;
  const start = (query.page - 1) * query.limit;
  const end = start + query.limit;
  const data = details.slice(start, end);
  return { data: data, total: title };
};

const {
  dataSource,
  loadTable,
  searchQuery,
  handleTableChange,
  getList,
  toRouterQuery,
} = useTable(getApi, {
  current: 1,
  pageSize: 10,
});

onActivated(async () => {
  await getDetailsInfo();
  await getList();
});

const columns = [
  {
    title: "序号",
    dataIndex: "index",
    key: "index",
    width: 50,
    customRender: ({ index }) => {
      return index + 1;
    },
  },
  {
    title: "我方主体",
    dataIndex: "ourCompanyName",
    key: "ourCompanyName",
    width: 200,
    ellipsis: true,
  },
  {
    title: "品牌",
    dataIndex: "brandName",
    key: "brandName",
    width: 100,
    ellipsis: true,
  },
  {
    title: "合同号",
    dataIndex: "contractNo",
    key: "contractNo",
    width: 160,
    ellipsis: true,
  },
  {
    title: "合同名称",
    dataIndex: "contractName",
    key: "contractName",
    width: 280,
    ellipsis: true,
  },
  {
    title: "对方客商",
    dataIndex: "counterpartyName",
    key: "counterpartyName",
    width: 200,
    ellipsis: true,
  },
  {
    title: "合同起止日期",
    dataIndex: "contractStartDate",
    key: "contractStartDate",
    width: 220,
    customRender: ({ record }) => {
      return `${record.contractStartDate} 至 ${record.contractEndDate}`;
    },
  },
  {
    title: "经办人",
    dataIndex: "handlerUserName",
    key: "handlerUserName",
    width: 136,
  },
];
const approveColumns = [
  {
    title: "",
    dataIndex: "icon",
    key: "icon",
    width: 50,
    align: "center",
  },
  {
    title: "操作人",
    dataIndex: " activityActioners",
    key: "activityActioners",
    width: 200,
    customRender: ({ record }) =>
      record.activityActioners.map((r) => r.name).join("/"),
  },
  {
    title: "审批状态",
    dataIndex: "result",
    key: "result",
    width: 150,
  },
  {
    title: "审批意见",
    dataIndex: "remark",
    key: "remark",
    width: 736,
  },
  {
    title: "操作时间",
    dataIndex: "data",
    key: "data",
    width: 210,
  },
];
</script>

<style lang="scss" scoped>
.borrowing-details {
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
  }
  :deep(.card_table) {
    padding: 0px;
    .ant-card-body {
      padding: 16px 24px;
    }
  }
  .purpose-checkbox-group {
    column-gap: 21px;
  }
  :deep(.ant-checkbox-disabled) {
    .ant-checkbox-inner {
      background: rgba(0, 0, 0, 0.04) !important;
      border: 1px solid #d9d9d9 !important;
      border-radius: 4px;
      &::after {
        border-color: rgba(0, 0, 0, 0.25);
      }
    }
  }
  .color_ {
    &spz {
      color: #1677ff;
    }
    &ty {
      color: #30a46c;
    }
    &jj {
      color: #ff4d4f;
    }
  }
  :deep(.table_process) {
    .ant-table-tbody tr td {
      &:first-child {
        border-top: none;
      }
    }
  }
}
</style>
