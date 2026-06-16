<template>
  <div class="contract-home page-content">
    <div class="flex home-content">
      <div class="home-left">
        <a-card class="left-card">
          <template #title>
            <div class="flex flex-column">
              <span>审批流程</span>
              <div class="flex flex-wrap" style="margin-top: 26px; gap: 16px">
                <a-radio-group
                  v-model:value="searchQuery.status"
                  class="radio-class flex-1"
                  @change="getHomeStatisticsData"
                >
                  <a-radio-button :value="1">
                    待处理({{ approveInfo.allUnprocessedCount || 0 }})
                  </a-radio-button>
                  <a-radio-button :value="2">
                    已处理({{ approveInfo.allProcessedCount || 0 }})
                  </a-radio-button>
                  <a-radio-button :value="3">
                    我发起的({{ approveInfo.allSubmitCount || 0 }})
                  </a-radio-button>
                  <a-radio-button :value="4">
                    抄送我的({{ approveInfo.allCopyCount || 0 }})
                  </a-radio-button>
                </a-radio-group>
                <div class="flex justify-end align-center right-text">
                  <div>
                    <span> 类型｜{{ currentContractTypeLabel }} </span>
                    <a-popover
                      overlayClassName="popover-class"
                      :overlayStyle="{ width: '100px' }"
                      placement="bottom"
                      trigger="click"
                    >
                      <template #content>
                        <div class="flex flex-column align-center">
                          <span
                            v-for="item in contractList.arr"
                            :key="item.value"
                            @click="handleContractType(item.value)"
                            class="popover-item"
                          >
                            {{ item.label }}
                          </span>
                        </div>
                      </template>
                      <a-button type="link" size="small" class="btn">
                        <DownOutlined />
                      </a-button>
                    </a-popover>
                  </div>
                  <div class="mg-l-medium">
                    <span> 流程时间｜{{ sortLabel }} </span>
                    <span style="margin-left: 2px">
                      <DownOutlined
                        v-if="searchQuery.sort === 'desc'"
                        @click="handleSort"
                      />
                      <UpOutlined v-else @click="handleSort" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </template>
          <ApprovalProcess
            :items="approvalList"
            :status="searchQuery.status"
            v-if="approvalList.length"
            @click="handleApprovalProcess"
          />
          <EmptyInfo v-else> </EmptyInfo>
        </a-card>
      </div>
      <div class="home-right flex-1 flex flex-column">
        <a-card
          v-for="card in rightCards"
          :key="card.key"
          :title="card.title"
          class="flex-1"
        >
          <template #extra>
            <a-button
              type="link"
              class="more-btn right-text"
              @click="router.push(card.moreLink)"
            >
              查看更多
              <RightOutlined />
            </a-button>
          </template>
          <component
            :is="card.component"
            v-if="card.data.length"
            :items="card.data"
            @click="card.onClick"
          />
          <EmptyInfo v-else />
        </a-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  watch,
  onMounted,
  onActivated,
  onDeactivated,
  onBeforeUnmount,
} from "vue";
import { DownOutlined, UpOutlined, RightOutlined } from "@ant-design/icons-vue";
import EmptyInfo from "@/components/system/EmptyInfo.vue";
import ApprovalProcess from "./components/ApprovalProcess.vue";
import WarningPanel from "./components/WarningPanel.vue";
import NoticePanel from "./components/NoticePanel.vue";
import AlertNoticePanel from "./components/AlertNoticePanel.vue";
import NoticeMoreModal from "./components/NoticeMoreModal.vue";
import WarningMoreModal from "./components/WarningMoreModal.vue";
import {
  getHomeStatisticsList,
  updateNotice,
  updateWarning,
} from "@/api/Home/index.js";
import { useRouter } from "vue-router";
import hookMap from "./hookMap.js";

defineOptions({
  name: "home",
});

const STATUS_MAP = {
  1: "allUnprocessedList",
  2: "allProcessedList",
  3: "allSubmitList",
  4: "allCopyList",
};

// 未读变量
const UNREAD = 0;

// 合同类型抄送变量
const CONTRACT_COPY = 2;

const { contractList } = hookMap();

const TIMEOUT_INTERVAL = 60000;
let timerId = null;
const router = useRouter();
const radioKey = ref(0);
const searchQuery = ref({
  status: 1,
  type: 0,
  sort: "desc",
});

const noticeList = ref([]);
const warningList = ref([]);
const approveInfo = ref({});
const approvalList = ref([]);

const handleContractType = (value) => {
  searchQuery.value.type = value;
  getHomeStatisticsData();
};

const handleApprovalProcess = async (item) => {
  if (item.noticeType === 5 && item.processSubtype === 1) {
    // 借阅-借阅详情
    router.push({
      path: "/contract/borrowing/BorrowingDetails",
      query: {
        id: item.sourceId,
      },
    });
  } else {
    // 1意向合同 2正式合同
    const url =
      item.dataType === 1
        ? "/contract/intention/detail"
        : "/contract/lifecycle/detail";
    const query = {
      id: item.sourceId,
    };
    if (item.processSubtype === CONTRACT_COPY && item.isRead === UNREAD) {
      // 抄送-更新通知
      handleUpdateNotice({ id: item.id });
    }
    // 审批-合同详情
    router.push({
      path: url,
      query,
    });
  }
};

const handleSort = () => {
  searchQuery.value.sort = searchQuery.value.sort === "desc" ? "asc" : "desc";
  getHomeStatisticsData();
};

const handleUpdateNotice = async (item) => {
  const res = await updateNotice(item.id);
  if (res.errno === 0) {
    getHomeStatisticsData();
  }
};
const handleUpdateWarningNotice = async (item) => {
  const res = await updateWarning(item.id);
  if (res.errno === 0) {
    getHomeStatisticsData();
  }
};

const getHomeStatisticsData = async () => {
  const query = {
    ...searchQuery.value,
    type: searchQuery.value.type === 0 ? null : searchQuery.value.type,
  };
  const { data } = await getHomeStatisticsList(query);
  const { approvalProcessList } = data;
  approveInfo.value = approvalProcessList ?? {};
  approvalList.value =
    approvalProcessList[STATUS_MAP[searchQuery.value.status]] ?? [];
  noticeList.value = data.noticeList ?? [];
  warningList.value = data.warningList ?? [];

  return data;
};

const stopTimer = () => {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
};
const init = async () => {
  if (timerId) clearTimeout(timerId);
  await getHomeStatisticsData();
  timerId = setTimeout(() => {
    init();
  }, TIMEOUT_INTERVAL);
};

const rightCards = computed(() => [
  {
    key: "notice",
    title: "通知信息",
    component: NoticePanel,
    data: noticeList.value,
    moreLink: "/home/NoticeCenter",
    onClick: handleUpdateNotice,
  },
  {
    key: "warning",
    title: "预警信息",
    component: AlertNoticePanel,
    data: warningList.value,
    moreLink: "/home/WarningCenter",
    onClick: handleUpdateWarningNotice,
  },
]);

const currentContractTypeLabel = computed(() => {
  return contractList.obj[searchQuery.value.type]?.label || "";
});

const sortLabel = computed(() => {
  return searchQuery.value.sort === "desc" ? "从晚到早" : "从早到晚";
});

onMounted(() => {
  // init();
  // startTimer();
});

onActivated(() => {
  // startTimer();
  init();
});

onDeactivated(() => {
  stopTimer();
});

onBeforeUnmount(() => {
  stopTimer();
});
</script>

<style scoped lang="scss">
.contract-home {
  position: relative;

  .home-content {
    height: 100%;
    gap: 0 16px;
  }

  :deep(.ant-card) {
    border-radius: 6px;

    .ant-card-head {
      box-shadow: none;
    }

    .ant-card-body {
      padding: 0px 16px 16px;
      overflow: auto;
    }
  }

  .home-left {
    width: 55%;

    :deep(.ant-card-body) {
      padding: 0px 16px 16px;
    }

    .left-card {
      height: 100%;

      :deep(.ant-card-head) {
        padding-bottom: 2px;
      }
    }
  }

  .home-right {
    height: 100%;
    position: relative;
    gap: 16px;
    box-sizing: border-box;

    .ant-card {
      flex: 1;
      min-height: 0;
    }
  }

  .radio-class {
    gap: 0 8px;
    display: flex;

    :deep(.ant-radio-button-wrapper) {
      background: rgba(0, 0, 0, 0.04);
      border-radius: 16px;
      border-inline-start-width: 1px;
      padding: 0px 16px;
      font-weight: 400;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
      border: none;

      &::before {
        display: none;
      }

      &.ant-radio-button-wrapper-checked {
        background: #1677ff;
        color: rgba(255, 255, 255, 0.9);
        border-radius: 16px;
      }
    }
  }

  .right-text {
    font-weight: 400;
    font-size: 12px;
    color: rgba(0, 0, 0, 0.45);
  }

  .anticon {
    width: 14px;
    height: 14px;
  }
  .btn {
    color: rgba(0, 0, 0, 0.45);
  }
}
</style>

<style lang="scss">
.popover-class {
  .ant-popover-arrow {
    left: 22%;
  }

  .ant-popover-inner {
    width: 100px;
    padding: 0px;
    .popover-item {
      padding: 4px 8px;
      width: 100%;
      text-align: center;
      cursor: pointer;
      &:hover {
        background: rgba(0, 0, 0, 0.04);
        color: #1677ff;
      }
    }
  }
}
</style>
