<template>
  <a-spin wrapperClassName="customer-form" :spinning="loading" size="large">
    <div class="flex flex-column main-content">
      <div class="page-content flex-1">
        <a-form
          class="form-meta-form"
          layout="vertical"
          ref="formRef"
          :model="formState"
        >
          <div class="card-pd card-border pd-y-medium pd-x-large">
            <a-form-item name="type" class="no-mg">
              <template #label>
                <span class="label">客商类型</span>
                <span class="tip">
                  「请先选择客商主体类型，不同类型填写内容不同」
                </span>
              </template>
              <a-radio-group
                class="radio-calss"
                v-model:value="formState.type"
                @change="handleCustomerTypeChange"
              >
                <a-radio-button
                  v-for="(item, index) in guestTypeList.arr"
                  :key="index"
                  :value="item.value"
                >
                  <div class="flex flex-column align-center text">
                    <span class="default-icon flex align-center justify-center">
                      <i class="iconfont" :class="icons[item.value]" />
                    </span>
                    <span class="label">{{ item.label }} </span>
                  </div>
                </a-radio-button>
              </a-radio-group>
            </a-form-item>
          </div>
          <a-card
            title="基础主体信息"
            :bordered="false"
            class="mg-t-small card-border pd-b-0"
          >
            <CorporateProfile
              v-model:formState="formState"
              :formRef="formRef"
              :province="province"
            />
          </a-card>
          <a-card
            title="业务类型"
            :bordered="false"
            class="mg-t-small card-border pd-b-0"
          >
            <BusinessInfo v-model:formState="formState" :formRef="formRef" />
          </a-card>
          <a-card
            title="银行账户信息"
            :bordered="false"
            class="mg-t-small card-border"
          >
            <BankAccountInfo v-model:formState="formState" :formRef="formRef" />
          </a-card>
          <a-card
            title="联系人信息"
            :bordered="false"
            class="mg-t-small card-border"
          >
            <ContactTable v-model:formState="formState" :formRef="formRef" />
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
import { ref, onMounted } from "vue";
import { message } from "ant-design-vue";
import { useRouter, useRoute } from "vue-router";
import { UploadOutlined } from "@ant-design/icons-vue";
import {
  getCustomerDetail,
  addCustomer,
  updateCustomer,
} from "@/api/Basic/customer.js";
import CorporateProfile from "./components/CustomerForm/CorporateProfile.vue";
import BankAccountInfo from "./components/CustomerForm/BankAccountInfo.vue";
import BusinessInfo from "./components/CustomerForm/BusinessInfo.vue";
import ContactTable from "./components/CustomerForm/ContactInfo.vue";
import useTabs from "@/hook/useTabs.js";
import city from "@/utils/city.json";
import hookMap from "@/views/Basic/hookMap";

const { guestTypeList } = hookMap();
const { toBack } = useTabs();
const route = useRoute();
const router = useRouter();

const province = ref({});
const detailsInfo = ref({});
const loading = ref(false);
const icons = {
  1: "icon-qiye",
  2: "icon-geren",
  3: "icon-daren",
};

// 客商类型
let customerType = {
  type: 1,
};
// 基础主体信息
let corporateProfile = {
  name: "",
  creditCode: "",
  legalPerson: "",
  status: undefined,
  mobile: "",
  registeMoney: "",
  establishDate: undefined,
  industry: "",
  registeProvince: undefined,
  registeCity: undefined,
  registeAddress: undefined,
  businessScope: "",
  licenseType: undefined,
  licenseCode: "",
};
// 业务类型
let businessInfo = {
  custType: undefined,
  channel: undefined,
  cooperateStatus: undefined,
  cooperateYears: "",
  cooperateMode: "",
  cooperateContent: "",
  notReason: "",
  platform: undefined,
};
// 银行账户信息
let supplierAccountsList = [];
// 联系人信息
let supplierPersonsList = [];
const formState = ref({
  ...customerType,
  ...corporateProfile,
  ...businessInfo,
  supplierAccountsList,
  supplierPersonsList,
});
const formRef = ref(null);
const formRules = ref({
  name: [
    {
      required: true,
      message: "请输入名称",
    },
  ],
  type: [
    {
      required: true,
      message: "请选择类型",
    },
  ],
});
const handleCustomerTypeChange = (val) => {
  const fields = ["name"];
  for (const key in corporateProfile) {
    if (!fields.includes(key)) {
      formState.value[key] = corporateProfile[key];
    }
  }
  formState.value.platform = "";
  formState.value.supplierAccountsList = [];
  formState.value.supplierPersonsList = [];
};
const handleCancel = () => {
  if (route.query.type === "details") {
    return toBack(-1);
  }
  toBack();
};
const apiFunctions = async (data) => {
  return route.query.id ? await updateCustomer(data) : await addCustomer(data);
};
const buildParams = async () => {
  const parmas = { ...formState.value };
  if (route.query.id) {
    parmas.id = route.query.id;
  }
  return parmas;
};
const handleSave = async () => {
  await formRef.value.validate();
  if (!formState.value.supplierAccountsList.length) {
    return message.warning("请添加银行账户信息");
  }
  if (!formState.value.supplierPersonsList.length) {
    return message.warning("请添加联系人信息");
  }
  const defaultBank = formState.value.supplierAccountsList.find(
    (item) => item.isDefault,
  );
  if (!defaultBank) {
    message.warning("请设置默认银行账户");
    return;
  }
  const authContact = formState.value.supplierPersonsList.find(
    (item) => item.isAuthorize,
  );
  if (!authContact) {
    message.warning("请设置授权代表联系人");
    return;
  }
  try {
    loading.value = true;
    const parmas = await buildParams();
    const res = await apiFunctions(parmas);
    loading.value = false;
    if (res.errno === 0) {
      message.success("保存成功");
      handleCancel();
    }
  } catch (error) {
    loading.value = false;
    const errorFields = error.errorFields || [];
    if (errorFields.length > 0) {
      const firstErrorField = errorFields[0]?.name || "";
      formRef.value.scrollToField(firstErrorField);
    }
  }
};

const initializeProvinceData = () => {
  const provinceObj = {};
  city.forEach((item) => {
    provinceObj[item.ext_name] = item;
  });
  province.value = provinceObj;
};
const getDetailsInfo = async () => {
  try {
    loading.value = true;
    const { data } = await getCustomerDetail({ id: route.query.id });
    detailsInfo.value = data;
    for (const key in formState.value) {
      if (key === "supplierAccountsList") {
        formState.value[key] = data.supplierAccounts || [];
      } else if (key === "supplierPersonsList") {
        formState.value[key] = data.supplierPersons || [];
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
  await initializeProvinceData();
  if (route.query.id) {
    await getDetailsInfo();
  }
});
</script>

<style lang="scss" scoped>
.customer-form {
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
  .no-mg {
    margin: 0;
  }
  .card-border {
    background: #ffffff;
    border: 1px solid #e8e8e8;
    box-shadow:
      0px 0px 1px 0px rgba(0, 0, 0, 0.08),
      0px 1px 2px 0px rgba(25, 15, 15, 0.07),
      0px 2px 4px 0px rgba(0, 0, 0, 0.05);
    border-radius: 6px;
  }
  .card-pd {
    .label {
      font-weight: 500;
      font-size: 16px;
      color: rgba(0, 0, 0, 0.85);
    }
    .tip {
      font-weight: 400;
      font-size: 12px;
      color: rgba(0, 0, 0, 0.45);
    }
    .radio-calss {
      display: flex;
      align-items: center;
      gap: 0 24px;
      border-radius: 10px;
      :deep(.ant-radio-button-wrapper) {
        border-radius: 10px;
        padding: 10px 61px;
        display: inline-table;
        border-inline-start-width: 1px;
        &::before {
          display: none;
        }
        &.ant-radio-button-wrapper-checked:not(
            .ant-radio-button-wrapper-disabled
          ) {
          background: #5b54fd;
          border-color: #5b54fd;
          .default-icon {
            background: rgba(255, 255, 255, 0.3);
            color: #ffffff;
          }
          .label {
            margin-top: 4px;
            color: #ffffff;
          }
        }
      }
      .text {
        font-weight: 500;
        font-size: 14px;
        color: rgba(0, 0, 0, 0.85);
        .default-icon {
          background: rgba(0, 0, 0, 0.06);
          border-radius: 6px;
          padding: 4px 3px;
          height: 24px;
          width: 24px;
        }
        .iconfont {
          font-size: 20px;
        }
        .label {
          font-weight: 500;
          font-size: 14px;
          color: rgba(0, 0, 0, 0.85);
          line-height: 20px;
          margin-top: 4px;
        }
      }
    }
  }
  .pd-b-0 {
    :deep(.ant-card-body) {
      padding-bottom: 0px;
    }
  }
}
</style>
