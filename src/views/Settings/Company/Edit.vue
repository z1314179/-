<template>
  <a-spin wrapperClassName="company-form" :spinning="loading" size="large">
    <div class="flex flex-column main-content">
      <div class="page-content flex-1">
        <a-form
          class="form-meta-form"
          ref="formRef"
          :model="formState"
          :rules="formRules"
          :label-col="{ style: { width: '77px' } }"
        >
          <a-card title="基本信息" :bordered="false">
            <div class="flex flex-wrap gap-24">
              <a-form-item label="公司编码" name="companyCode">
                <a-input
                  v-model:value="formState.companyCode"
                  placeholder="请输入公司编码"
                  :maxlength="200"
                  allow-clear
                  style="width: 260px"
                />
              </a-form-item>
              <a-form-item label="公司名称" name="companyName">
                <a-input
                  v-model:value="formState.companyName"
                  placeholder="请输入公司名称"
                  :maxlength="200"
                  allow-clear
                  style="width: 260px"
                />
              </a-form-item>
              <a-form-item label="公司法人" name="legalPerson">
                <a-input
                  v-model:value="formState.legalPerson"
                  placeholder="请输入公司法人"
                  :maxlength="200"
                  allow-clear
                  style="width: 260px"
                />
              </a-form-item>
            </div>
            <a-form-item label="上级公司" name="parentCompanyId">
              <a-select
                v-model:value="formState.parentCompanyId"
                :options="companyListAll.arr"
                :filter-option="
                  (input, option) =>
                    option.companyName
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                "
                :fieldNames="{ label: 'companyName', value: 'id' }"
                allow-clear
                show-search
                placeholder="请选择"
                style="width: 260px"
              />
            </a-form-item>
            <div class="flex">
              <a-form-item label="注册地址" name="registeProvince">
                <a-select
                  v-model:value="formState.registeProvince"
                  placeholder="省"
                  showSearch
                  allowClear
                  :filter-option="filterOption"
                  @change="formState.registeCity = undefined"
                  style="width: 120px"
                >
                  <a-select-option
                    :value="item.ext_name"
                    :name="item.ext_name"
                    v-for="item in province"
                    :key="item.id"
                    >{{ item.ext_name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
              <a-form-item
                label=" "
                name="registeCity"
                class="mg-l-small no-label"
              >
                <a-select
                  v-model:value="formState.registeCity"
                  placeholder="市"
                  showSearch
                  allowClear
                  :filter-option="filterOption"
                  style="width: 120px"
                >
                  <a-select-option
                    :value="item.ext_name"
                    :name="item.ext_name"
                    v-for="item in province[formState.registeProvince]
                      ?.children || []"
                    :key="item.id"
                    >{{ item.ext_name }}</a-select-option
                  >
                </a-select>
              </a-form-item>
              <a-form-item
                label=" "
                name="registAddress"
                class="mg-l-small flex-1 no-label"
              >
                <a-input
                  v-model:value="formState.registAddress"
                  :maxlength="200"
                  allowClear
                  placeholder="请输入详细地址"
                  style="max-width: 732px"
                />
              </a-form-item>
            </div>
            <a-form-item label="描述" name="remark" class="mg-b-0">
              <a-textarea
                v-model:value="formState.remark"
                placeholder="请输入描述"
                :auto-size="{ minRows: 4, maxRows: 8 }"
                :maxlength="200"
                show-count
                allow-clear
                style="max-width: 988px"
              />
            </a-form-item>
          </a-card>
          <a-card title="账户信息" :bordered="false" class="mg-t-small">
            <div style="max-width: 1300px">
              <div class="mg-b-medium">
                <a-button type="primary" size="small" @click="handleAdd"
                  >添加账户</a-button
                >
                <a-popconfirm
                  placement="top"
                  ok-text="确定"
                  cancel-text="取消"
                  @confirm="handleDelete"
                  :disabled="!ids.length"
                >
                  <template #title>
                    <div>你确定要删除吗？</div>
                  </template>
                  <a-button
                    class="mg-l-small"
                    :disabled="!ids.length"
                    size="small"
                    >删除</a-button
                  >
                </a-popconfirm>
              </div>
              <a-table
                :row-selection="rowSelection"
                row-key="key"
                :columns="columns"
                :data-source="formState.accountList"
                :pagination="false"
                bordered
                :scroll="{ x: 1400 }"
              >
                <template #bodyCell="{ column, record, index }">
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
                    <a-tooltip :title="record.remark">
                      <span>
                        {{ record.remark }}
                      </span>
                    </a-tooltip>
                  </template>
                  <template v-else-if="column.dataIndex === 'cz'">
                    <a-button type="link" @click="handleEdit(record, index)">
                      编辑
                    </a-button>
                  </template>
                </template>
              </a-table>
            </div>
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
    <BankModal
      v-model:open="openState"
      :detailsInfo="cardData"
      :type="1"
      @change="handleBankChange"
    />
  </a-spin>
</template>

<script setup>
import { reactive, ref, onMounted, computed, unref } from "vue";
import { useRoute } from "vue-router";
import { message } from "ant-design-vue";
import {
  getCompanyDetail,
  addCompany,
  updateCompany,
} from "@/api/Settings/company.js";
import BankModal from "./modals/BankModal.vue";
import useTabs from "@/hook/useTabs.js";
import city from "@/utils/city.json";
import hookMap from "@/views/Settings/hookMap.js";

defineOptions({ name: "SettingsCompanyEditPage" });

const { bankAccountTypeList, bankAccountDefaultList, companyListAll } = hookMap(
  { isCompany: true },
);
const { toBack } = useTabs();
const route = useRoute();

const ids = ref([]);
const province = ref({});
const openState = ref(false);
const cardData = ref({});
const cardIndex = ref(null);
const loading = ref(false);

const formRules = {
  companyCode: [
    { required: true, message: "请输入公司编码", trigger: "change" },
  ],
  companyName: [
    { required: true, message: "请输入公司名称", trigger: "change" },
  ],
};
let formData = {
  companyCode: "",
  companyName: "",
  legalPerson: "",
  parentCompanyId: undefined,
  registeProvince: undefined,
  registeCity: undefined,
  registAddress: undefined,
  remark: "",
  accountList: [],
};
const formState = ref({ ...formData });
const formRef = ref(null);

function handleCancel() {
  toBack();
}
const apiFunctions = async (data) => {
  return route.query.id ? await updateCompany(data) : await addCompany(data);
};
const handleSave = async () => {
  await formRef.value?.validate();
  try {
    loading.value = true;
    const params = { ...formState.value };
    if (route.query.id) {
      params.id = route.query.id;
    }
    const res = await apiFunctions(params);
    loading.value = false;
    if (res.errno === 0) {
      message.success("保存成功");
      handleCancel();
    }
  } catch {
    loading.value = false;
  }
};

const filterOption = (input, option) => {
  return option.name.indexOf(input) >= 0;
};

const handleAdd = () => {
  cardIndex.value = null;
  cardData.value = {};
  openState.value = true;
};

const handleEdit = (record, index) => {
  cardIndex.value = index;
  cardData.value = { ...record };
  openState.value = true;
};

const handleDelete = () => {
  ids.value = formState.value.accountList.map((item) => item.key);
  formState.value.accountList = formState.value.accountList.filter(
    (item) => !ids.value.includes(item.key),
  );
  ids.value = [];
};

const getDetailsInfo = async () => {
  try {
    loading.value = true;
    const { data } = await getCompanyDetail({ id: route.query.id });
    data.companyAccounts = data.companyAccounts?.map((item) => {
      return {
        ...item,
        key: item.id,
      };
    });
    for (const key in formState.value) {
      if (key === "accountList") {
        formState.value[key] = data.companyAccounts;
      } else {
        formState.value[key] = data[key] || formState.value[key];
      }
    }
    loading.value = false;
  } catch (error) {
    loading.value = false;
  }
};

const handleBankChange = async (val) => {
  if (val.isDefault) {
    formState.value.accountList.forEach((item) => {
      if (item.isDefault && item.key !== val.key) {
        item.isDefault = 0;
      }
    });
  }
  if (cardIndex.value != null) {
    const row = formState.value.accountList[cardIndex.value];
    formState.value.accountList.splice(cardIndex.value, 1, {
      ...val,
      key: row.key,
    });
  } else {
    const key = formState.value.accountList.length + 1;
    formState.value.accountList.push({ ...val, key: key });
  }
};

const initializeProvinceData = () => {
  const provinceObj = {};
  city.forEach((item) => {
    provinceObj[item.ext_name] = item;
  });
  province.value = provinceObj;
};
const categoryList = ref([]);
const rowSelection = computed(() => {
  return {
    selections: false,
    preserveSelectedRowKeys: true,
    selectedRowKeys: unref(ids.value.map((e) => e.key)),
    onChange: (selectedRowKeys, selectedRows) => {
      ids.value = selectedRows;
    },
  };
});

onMounted(async () => {
  await initializeProvinceData();
  if (route.query.id) {
    getDetailsInfo();
  }
});
const columns = [
  {
    title: "账户类型",
    dataIndex: "accountType",
    key: "accountType",
    width: 200,
    ellipsis: true,
    customRender: ({ record }) =>
      bankAccountTypeList.obj[record.accountType]?.label,
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
    customRender: ({ record }) =>
      bankAccountDefaultList.obj[record.isDefault]?.label,
  },
  { title: "操作", dataIndex: "cz", key: "cz", width: 70, align: "center" },
];
</script>

<style lang="scss" scoped>
.company-form {
  height: 100%;
  :deep(.ant-spin-container) {
    height: 100%;
  }
  .gap-24 {
    gap: 24px;
  }
  .no-label {
    :deep(.ant-form-item-label) {
      display: none;
    }
  }
}
</style>
