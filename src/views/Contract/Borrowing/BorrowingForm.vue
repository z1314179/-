<template>
  <a-spin wrapperClassName="borrowing-form" :spinning="loading" size="large">
    <div class="flex flex-column main-content">
      <div class="page-content flex-1">
        <a-form
          class="form-meta-form"
          layout="vertical"
          ref="formRef"
          :model="formState"
          :rules="formRules"
        >
          <a-card title="借阅信息" :bordered="false" class="pd-b-0">
            <div class="flex flex-wrap gap-24">
              <a-form-item label="借阅人" name="applicantUserId">
                <a-select
                  v-model:value="formState.applicantUserId"
                  :options="userOptions"
                  :fieldNames="{ label: 'userName', value: 'id' }"
                  :filter-option="filterOption"
                  allow-clear
                  show-search
                  placeholder="请选择借阅人"
                  style="width: 260px"
                  @change="handleChangeApplicantUserId"
                >
                </a-select>
              </a-form-item>
              <a-form-item label="借阅起止日期" name="borrowStartDate">
                <a-range-picker
                  v-model:value="formState.borrowStartDate"
                  :format="'YYYY-MM-DD'"
                  :value-format="'YYYY-MM-DD'"
                  allow-clear
                  style="width: 260px"
                />
              </a-form-item>
            </div>
            <a-form-item label="借阅原因" name="borrowReason">
              <a-textarea
                v-model:value="formState.borrowReason"
                :auto-size="{ minRows: 1 }"
                :maxlength="200"
                allow-clear
                placeholder="请输入借阅原因"
                style="max-width: 1369px"
              />
            </a-form-item>
          </a-card>
          <a-card
            title="借阅数据"
            :bordered="false"
            class="card_table mg-t-small"
          >
            <div class="max-height flex flex-column" style="max-width: 1369px">
              <div>
                <a-button
                  type="primary"
                  class="mg-b-small"
                  @click="drawerOpen = true"
                >
                  选择数据
                </a-button>
              </div>
              <a-table
                row-key="id"
                :columns="columns"
                :data-source="dataSource"
                :loading="loadTable"
                :pagination="searchQuery"
                @change="handleTableChange"
              >
                <template #bodyCell="{ column, record, index }">
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
                      <span>
                        {{ record.contractNo }}
                      </span>
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
                  <template v-if="column.dataIndex === 'cz'">
                    <a-button type="link" @click="handleDelete(index)">
                      删除
                    </a-button>
                  </template>
                </template>
              </a-table>
            </div>
          </a-card>
          <a-card title="借阅用途" :bordered="false" class="mg-t-small pd-b-0">
            <a-form-item label="" name="purposeArray" class="no-mg">
              <a-checkbox-group
                v-model:value="formState.purposeArray"
                :options="purposeOptions"
                class="purpose-checkbox-group"
              />
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
        <a-button
          class="mg-l-small"
          @click="handleSubmit('save')"
          type="primary"
          ghost
        >
          保存
        </a-button>
        <a-button
          class="mg-l-small"
          @click="handleSubmit('submit')"
          type="primary"
        >
          提交
        </a-button>
      </div>
    </div>
  </a-spin>

  <BorrowingDataDrawers
    :brandOptionsWithAll="brandList"
    :subjectOptionsWithAll="subjectOptionsWithAll"
    v-model:open="drawerOpen"
    :selectedContractNos="formState.contractIdArray"
    @confirm="onDrawerConfirm"
  />
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { message } from "ant-design-vue";
import { useRoute, useRouter } from "vue-router";
import { getBorrowingDetail, addBorrowing } from "@/api/Contract/borrowing.js";
import { getBrandList } from "@/api/Digital/ledger.js";
import { getTableList } from "@/api/users";
import useTabs from "@/hook/useTabs.js";
import BorrowingDataDrawers from "./modals/BorrowingDataDrawers.vue";
import useTable from "@/hook/useTable.js";
import useStore from "@/store/user.js";
import hookMap from "@/views/Contract/hookMap";

const { subjectOptionsWithAll } = hookMap([1]);
const { toBack } = useTabs();
const route = useRoute();
const router = useRouter();
const loading = ref(false);
const applicantUserList = ref([]);
const user = useStore();

const drawerOpen = ref(false);
const userOptions = ref([]);
const brandList = ref([]);

const purposeOptions = [
  { label: "在线查看", value: 1 },
  { label: "下载附件", value: 2 },
  // { label: "下载合同", value: 3 },
];

let formData = {
  applicantUserId: undefined,
  applicantUserName: "",
  borrowStartDate: [],
  borrowEndDate: "",
  borrowReason: "",
  contractIdArray: [],
  purposeArray: [],
};
const formState = ref({ ...formData });
const formRef = ref(null);
const formRules = ref({
  applicantUserId: [
    {
      required: true,
      message: "请选择借阅人",
      trigger: "change",
    },
  ],
  borrowStartDate: [
    {
      required: true,
      message: "请选择借阅起止时间",
      trigger: "change",
    },
  ],
  borrowReason: [
    {
      required: true,
      message: "请输入借阅原因",
      trigger: "change",
    },
  ],
});

const filterOption = (input, option) => {
  return option.userName.toLowerCase().indexOf(input.toLowerCase()) >= 0;
};

const onDrawerConfirm = (rows) => {
  const list = rows.map((item) => {
    return {
      ...item,
      ourCompanyName: item.ourCompanyRelations?.map((e) => e.companyName),
      counterpartyName: item.counterpartyRelations?.map(
        (e) => e.counterpartyName,
      ),
      contractStartDate: item.startDate,
      contractEndDate: item.endDate,
    };
  });
  formState.value.contractIdArray = list;
  getList();
};
const handleChangeApplicantUserId = (value, option) => {
  formState.value.applicantUserName = option?.userName;
};

const handleDelete = (index) => {
  formState.value.contractIdArray.splice(index, 1);
  if (dataSource.value.length === 1 && searchQuery.current > 1) {
    searchQuery.current -= 1;
  }
  getList();
};

const handleCancel = () => {
  toBack();
};
const buildParams = async (type) => {
  const params = {
    ...formState.value,
    borrowStartDate: formState.value.borrowStartDate[0],
    borrowEndDate: formState.value.borrowStartDate[1],
    contractIdArray: formState.value.contractIdArray.map((item) => item.id),
    isSubmit: type === "submit" ? 1 : 0,
  };

  if (route.query.id) {
    params.id = route.query.id;
  }
  return params;
};

const handleSubmit = async (type) => {
  await formRef.value.validate();
  if (!formState.value.contractIdArray.length) {
    return message.warning("请选择借阅数据");
  }
  if (!formState.value.purposeArray.length) {
    return message.warning("请选择借阅用途");
  }
  try {
    loading.value = true;
    const params = await buildParams(type);
    const res = await addBorrowing(params);
    loading.value = false;
    if (res.errno === 0) {
      message.success(type === "submit" ? "提交成功" : "保存成功");
      handleCancel();
    }
  } catch (error) {
    loading.value = false;
  }
};
const getDetailsInfo = async () => {
  try {
    loading.value = true;
    const { data } = await getBorrowingDetail({ id: route.query.id });
    for (const key in formState.value) {
      if (key === "borrowStartDate") {
        formState.value[key] = [data.borrowStartDate, data.borrowEndDate];
      } else if (key === "contractIdArray") {
        formState.value[key] = data.details || [];
      } else {
        formState.value[key] = data[key] || formState.value[key];
      }
    }
    await getList();
    loading.value = false;
  } catch (error) {
    loading.value = false;
  }
};

const getTableListData = async () => {
  const { data } = await getTableList({ isAll: 1 });
  userOptions.value = data || [];
};

const getBrandData = async () => {
  const { data } = await getBrandList();
  brandList.value = data || [];
};

const getApi = async (query) => {
  const title = formState.value.contractIdArray.length;
  const start = (query.page - 1) * query.limit;
  const end = start + query.limit;
  const data = formState.value.contractIdArray.slice(start, end);
  return { data: data, total: title };
};

const {
  dataSource,
  loadTable,
  searchQuery,
  handleTableChange,
  getList,
  search,
  reset,
} = useTable(getApi, {});

onMounted(async () => {
  await getTableListData();
  await getBrandData();
  if (!route.query.id) {
    formState.value.applicantUserId = user.userinfo.id;
    formState.value.applicantUserName = user.userinfo.username;
  } else {
    await getDetailsInfo();
  }
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
  {
    title: "操作",
    dataIndex: "cz",
    key: "cz",
    fixed: "right",
    width: 50,
  },
];
</script>

<style lang="scss" scoped>
.borrowing-form {
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
  .no-mg {
    margin: 0;
  }
  .max-height {
    max-height: 800px;
  }
  .gap-24 {
    gap: 0 24px;
  }
  .pd-b-0 {
    :deep(.ant-card-body) {
      padding-bottom: 0px;
    }
  }
  .purpose-checkbox-group {
    column-gap: 21px;
  }
  :deep(.card_table) {
    padding: 0px;
    .ant-card-body {
      padding: 16px 24px;
    }
  }
}
</style>
