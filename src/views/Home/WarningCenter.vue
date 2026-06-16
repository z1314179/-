<template>
  <a-spin wrapperClassName="warning-center" :spinning="loading" size="large">
    <div class="page-content">
      <a-card :bordered="false">
        <template #title>
          <div class="flex flex-column">
            <span>预警中心</span>
            <div class="flex" style="margin-top: 26px">
              <a-radio-group
                v-model:value="searchQuery.isRead"
                class="radio-class"
                @change="getHomeWarningData()"
              >
                <a-radio-button :value="0"
                  >未读({{ unReadCount }})</a-radio-button
                >
                <a-radio-button :value="1">
                  已读({{ readCount }})
                </a-radio-button>
                <a-radio-button :value="2">
                  全部({{ allCount }})
                </a-radio-button>
              </a-radio-group>
            </div>
          </div>
        </template>
        <AlertNoticePanel
          :items="warningList"
          :class="{ read: searchQuery.isRead == 1 }"
          v-if="warningList.length"
          @click="handleUpdateWarningNotice"
        />
        <EmptyInfo v-else> </EmptyInfo>
      </a-card>
    </div>
  </a-spin>
</template>
<script setup>
import { onActivated, ref, computed } from "vue";
import { message } from "ant-design-vue";
import { useRouter, useRoute } from "vue-router";
import { getHomeWarningList, updateWarning } from "@/api/Home/index.js";
import EmptyInfo from "@/components/system/EmptyInfo.vue";
import AlertNoticePanel from "./components/AlertNoticePanel.vue";

defineOptions({ name: "WarningCenter" });

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const allCount = ref(0);
const readCount = ref(0);
const unReadCount = ref(0);
const warningList = ref([]);
const searchQuery = ref({
  isRead: 0,
});

const handleUpdateWarningNotice = async (item) => {
  if (!searchQuery.value.isRead == 0) return;
  const res = await updateWarning(item.id);
  if (res.errno === 0) {
    getHomeWarningData();
  }
};

const getHomeWarningData = async () => {
  try {
    loading.value = true;
    const query = {
      isRead: searchQuery.value.isRead === 2 ? null : searchQuery.value.isRead,
    };
    const { data } = await getHomeWarningList(query);
    allCount.value = data.allCount || 0;
    readCount.value = data.readCount || 0;
    unReadCount.value = data.unReadCount || 0;
    warningList.value = data.list || [];
    loading.value = false;
  } catch (error) {
    loading.value = false;
  }
};

const init = () => {
  getHomeWarningData({ ...searchQuery.value });
};

onActivated(() => {
  init();
});
</script>
<style lang="scss" scoped>
.warning-center {
  :deep(.ant-card) {
    height: 100%;
    border-radius: 6px;
    .ant-card-head {
      box-shadow: none;
      padding-bottom: 2px;
    }
    .ant-card-body {
      padding: 0px 16px 24px;
      overflow: auto;
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
  .read {
    opacity: 0.5;
  }
}
</style>
