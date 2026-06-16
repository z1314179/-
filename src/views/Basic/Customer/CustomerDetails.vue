<template>
  <a-spin :spinning="loading" size="large">
    <div class="customer-details pd-x-medium pd-y-medium">
      <div class="header bg-whidte flex align-center">
        <span class="flex-1">
          <template v-if="detailsInfo.type === 1">
            <span class="title">{{ detailsInfo.name }}</span>
            <span class="mg-l-small tip">企业</span>
          </template>
        </span>
        <a-button @click="handleColese">关闭</a-button>
        <a-button
          class="mg-l-small"
          type="primary"
          @click="handleEdit"
          v-if="PERM('客商编辑')"
        >
          编辑
        </a-button>
      </div>
      <div class="bg-whidte mg-t-small">
        <a-form class="info_form" layout="vertical">
          <div class="pd-b-medium pd-x-large pd-t-5">
            <a-tabs
              v-model:activeKey="activeKey"
              :destroyInactiveTabPane="true"
              size="large"
              class="tabs-size"
            >
              <a-tab-pane :key="1" tab="基础主体信息">
                <CompanyInfo
                  class="mg-t-medium"
                  v-if="detailsInfo.type === 1"
                  :formState="detailsInfo"
                />
                <BasicInfo class="mg-t-medium" v-else :fields="mainFields" />
              </a-tab-pane>
              <a-tab-pane :key="2" tab="业务信息">
                <div class="mg-t-medium" style="max-width: 1100px">
                  <BasicInfo :fields="businessFields" />
                </div>
              </a-tab-pane>
              <a-tab-pane :key="3" tab="银行信息">
                <div class="flex flex-wrap mg-t-medium card-gap">
                  <div
                    v-for="(item, index) in detailsInfo.supplierAccounts"
                    :key="index"
                  >
                    <BankCard :data="item">
                      <template #[slotName]>
                        <div class="flex bank-item">
                          <div class="flex-1" v-if="detailsInfo.type === 1">
                            <div class="title">
                              <i class="iconfont icon-yinhang" />
                              {{
                                item.accountType === 1 ? "基本账户" : "一般账户"
                              }}
                            </div>
                          </div>
                          <div>
                            <span
                              class="tag_default mg-l-10"
                              :class="{ tag_by: !item.isDefault }"
                            >
                              {{ item.isDefault ? "默认" : "备用" }}
                            </span>
                          </div>
                        </div>
                      </template>
                    </BankCard>
                  </div>
                </div>
              </a-tab-pane>
              <a-tab-pane :key="4" tab="联系人信息">
                <div class="flex flex-wrap mg-t-medium card-gap">
                  <div
                    v-for="(item, index) in detailsInfo.supplierPersons"
                    :key="index"
                  >
                    <ContactCard :data="item">
                      <template #card-title>
                        <div class="flex contact-item">
                          <div class="flex-1 flex align-center mg-b-small">
                            <span
                              class="icon-bg flex align-center justify-center"
                            >
                              <i class="iconfont icon-geren" />
                            </span>
                            <div class="flex flex-column mg-l-small">
                              <span class="name">{{ item.name }}</span>
                              <span v-if="detailsInfo.type === 1">
                                {{ item.position }}
                              </span>
                            </div>
                          </div>
                          <div>
                            <span
                              class="tag_default mg-l-10"
                              v-if="item.isAuthorize"
                            >
                              授权代表
                            </span>
                          </div>
                        </div>
                      </template>
                    </ContactCard>
                  </div>
                </div>
              </a-tab-pane>
              <a-tab-pane :key="5" tab="合作信息">
                <div class="mg-t-medium">
                  <a-radio-group
                    v-model:value="radioType"
                    button-style="solid"
                    class="mg-b-medium radio_group_bg"
                  >
                    <a-radio-button :value="1">合同列表</a-radio-button>
                    <a-radio-button :value="2">收付记录</a-radio-button>
                  </a-radio-group>
                  <ContractTable v-if="radioType == 1" />
                  <PaymentTable v-else />
                </div>
              </a-tab-pane>
            </a-tabs>
          </div>
        </a-form>
      </div>
    </div>
  </a-spin>
</template>

<script setup>
import { ref, onActivated, computed, inject } from "vue";
import { message } from "ant-design-vue";
import { useRouter, useRoute } from "vue-router";
import { UploadOutlined } from "@ant-design/icons-vue";
import { getCustomerDetail } from "@/api/Basic/customer.js";
import useTabs from "@/hook/useTabs.js";
import city from "@/utils/city.json";
import CompanyInfo from "./components/CustomerDetails/CompanyInfo.vue";
import BasicInfo from "./components/CustomerDetails/BasicInfo.vue";
import BankCard from "./components/BankCard.vue";
import ContactCard from "./components/ContactCard.vue";
import ContractTable from "./components/CustomerDetails/ContractTable.vue";
import PaymentTable from "./components/CustomerDetails/PaymentTable.vue";
import hookMap from "@/views/Basic/hookMap";

const { toBack } = useTabs();
const {
  guestTypeList,
  businessStatusList,
  idCardTypeList,
  guestClassifyList,
  importChannelList,
  cooperationProgressList,
} = hookMap();

const PERM = inject("PERM");
const route = useRoute();
const router = useRouter();
const detailsInfo = ref({});
const activeKey = ref(1);
const radioType = ref(1);
const loading = ref(false);

let mainFieldMappings = {
  type: (val) => guestTypeList.obj[val]?.label,
  licenseType: (val) => idCardTypeList.obj[val]?.label,
};
let businessFieldMappings = {
  custType: (val) => guestClassifyList.obj[val]?.label,
  channel: (val) => importChannelList.obj[val]?.label,
  cooperateStatus: (val) => cooperationProgressList.obj[val]?.label,
};

const mainFields = ref({
  name: { label: "客商名称", value: "-" },
  type: { label: "客商类型", value: "-" },
  licenseType: { label: "证照类型", value: "-" },
  licenseCode: { label: "证照号码", value: "-" },
  mobile: { label: "联系电话", value: "-" },
});

let initialBusinessFields = {
  custType: { label: "客商分类", value: "-" },
  channel: { label: "引入渠道", value: "-" },
  platform: { label: "达人机构", value: "-" },
  cooperateStatus: { label: "合作进度", value: "-" },
  cooperateYears: { label: "合作年限(年)", value: "-" },
  cooperateMode: { label: "合作模式", value: "-" },
  cooperateContent: { label: "合作内容", value: "-" },
  notReason: { label: "未合作原因", value: "-" },
};
const businessFields = ref({});

const handleColese = () => {
  toBack();
};

const handleEdit = () => {
  router.push({
    path: "/basic/customer/edit",
    query: { id: route.query.id, type: "details" },
  });
};

const sortList = (list, field) => {
  list.sort((a, b) => {
    if (a[field]) {
      return -1;
    }
    return 0;
  });
};

// 赋值
const applyFieldValues = (fields, data, mappings) => {
  Object.keys(fields).forEach((key) => {
    if (key in mappings) {
      fields[key].value = mappings[key](data[key]);
    } else {
      fields[key].value = data[key] || fields[key].value;
    }
  });
};
const getDetailsInfo = async () => {
  try {
    loading.value = true;
    const { data } = await getCustomerDetail({ id: route.query.id });
    detailsInfo.value = data;

    if (data.type !== 1) {
      applyFieldValues(mainFields.value, data, mainFieldMappings);
    }
    const excludeKeys = [
      data.type != 3 && "platform",
      ...(data.cooperateStatus === 1
        ? ["cooperateYears", "cooperateMode", "cooperateContent"]
        : ["notReason"]),
    ].filter(Boolean);
    businessFields.value = Object.fromEntries(
      Object.entries(initialBusinessFields).filter(
        ([key]) => !excludeKeys.includes(key),
      ),
    );
    applyFieldValues(businessFields.value, data, businessFieldMappings);
    loading.value = false;
  } catch (error) {
    loading.value = false;
  }
};

const slotName = computed(() =>
  detailsInfo.value.type === 1 ? "card-title" : "content-right",
);

onActivated(async () => {
  await getDetailsInfo();
});
</script>

<style lang="scss" scoped>
.customer-details {
  .bg-whidte {
    background: #ffffff;
    box-shadow:
      0px 0px 1px 0px rgba(0, 0, 0, 0.08),
      0px 1px 2px 0px rgba(25, 15, 15, 0.07),
      0px 2px 4px 0px rgba(0, 0, 0, 0.05);
    border-radius: 6px;
  }

  .header {
    padding: 12px 24px;
    font-weight: 500;
    font-size: 16px;
    color: rgba(0, 0, 0, 0.85);

    .tip {
      background: #e6f4ff;
      border-radius: 4px;
      font-weight: 400;
      font-size: 12px;
      color: var(--color-primary);
      padding: 3px 8px;
    }
  }
  .tabs-size {
    :deep(.ant-tabs-tab-btn) {
      font-weight: 500;
      color: rgba(0, 0, 0, 0.88);
    }
    :deep(.ant-tabs-tab-active) {
      .ant-tabs-tab-btn {
        font-weight: 500;
        color: rgba(0, 0, 0, 0.85);
      }
    }
  }
  .pd-t-5 {
    padding-top: 5px;
  }
  .card-gap {
    gap: 24px;
  }
  .tag_default {
    background: #d0f6e0;
    color: #007f56;
    border-radius: 4px;
    font-weight: 400;
    font-size: 12px;
    padding: 2px 8px;
    &.tag_by {
      background: #d9d9d9;
      color: rgba(0, 0, 0, 0.45);
    }
  }
  .icon-bg {
    background: rgba(22, 122, 255, 0.09);
    border-radius: 6px;
    color: var(--color-primary);
    padding: 2px;
    width: 32px;
    height: 32px;
  }

  .bank-item {
    .title {
      font-weight: 500;
      padding-bottom: 5px;
    }
  }
  .info_form {
    :deep(.ant-form-item) {
      margin-right: 24px;
      .ant-form-item-row {
        width: 200px;
      }
    }
  }
  .name {
    font-weight: 500;
    font-size: 14px;
    line-height: 20px;
  }
  .icon-yinhang {
    color: #1677ff;
  }
  .icon-geren {
    font-size: 27px;
  }
}
</style>
