<template>
  <div class="page-content payment">
    <SearchCard :is-exp="false">
      <a-form
        layout="inline"
        autocomplete="off"
        :label-col="{ style: { width: '98px' } }"
      >
        <a-form-item label="我方主体">
          <a-select
            class="select-placeholder"
            allow-clear
            v-model:value="formState.ourCompanyId"
            :options="subjectOptionsWithAll.arr"
            :fieldNames="{
              label: 'companyName',
              value: 'id',
            }"
            placeholder="全部"
          />
        </a-form-item>
        <a-form-item label="对方客商">
          <a-input
            v-model:value="formState.counterpartyName"
            :maxlength="200"
            allow-clear
            placeholder="请输入"
          />
        </a-form-item>
        <a-form-item label="合同号">
          <a-input
            v-model:value="formState.contractNo"
            :maxlength="200"
            allow-clear
            placeholder="请输入"
          />
        </a-form-item>
        <a-form-item label="合同名称">
          <a-input
            v-model:value="formState.contractName"
            :maxlength="200"
            allow-clear
            placeholder="请输入"
          />
        </a-form-item>
        <a-form-item label="品牌">
          <a-select
            class="select-placeholder"
            allow-clear
            v-model:value="formState.brandName"
            :options="brandOptionsWithAll.arr"
            placeholder="全部"
          />
        </a-form-item>
        <a-form-item label="合同开始日期">
          <a-range-picker
            v-model:value="formState.validityDateRange"
            value-format="YYYY-MM-DD"
            :placeholder="['开始日期', '结束日期']"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="经办人">
          <a-input
            v-model:value="formState.handlerUserName"
            :maxlength="200"
            allow-clear
            placeholder="请输入"
          />
        </a-form-item>
      </a-form>
      <template #right>
        <a-button class="mg-l-1" @click="handleExport">导 出</a-button>
        <a-button class="mg-l-1" @click="reset">重 置</a-button>
        <a-button class="mg-l-1" type="primary" @click="search">查 询</a-button>
      </template>
    </SearchCard>
    <a-card :bordered="false" class="card_table mg-t-small">
      <a-table
        row-key="id"
        :columns="columns"
        :data-source="dataSource"
        :loading="loadTable"
        :pagination="searchQuery"
        @change="handleTableChange"
        :scroll="{ x: 1824 }"
      >
        <template #bodyCell="{ column, record }">
          <template
            v-if="
              ['合同号', '合同名称', '我方主体', '对方客商'].includes(
                column.dataIndex,
              )
            "
          >
            <a-tooltip :title="record[column.dataIndex]">
              <span>
                {{ record[column.dataIndex] }}
              </span>
            </a-tooltip>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
import { onActivated, ref } from "vue";
import SearchCard from "@/components/system/SearchCard.vue";
import useTable from "@/hook/useTable.js";
import contractHookMap from "@/views/Contract/hookMap.js";
import {
  getReportPaymentList,
  exportReportPaymentList,
} from "@/api/Report/payment.js";

defineOptions({ name: "ReportPaymentPage" });

const { subjectOptionsWithAll, brandOptionsWithAll } = contractHookMap([1]);

const exportLoad = ref(false);

const handleExport = async () => {
  if (exportLoad.value) return message.warning("正在导出中，请勿重复点击");
  exportLoad.value = true;
  const query = getSearchQuery({ ...formState.value });
  try {
    const res = await exportReportPaymentList(query);
    exportLoad.value = false;
    const { errno, data = {} } = res;
    if (errno === 0 && data.filePath) {
      exportUrl(res.data.filePath);
    }
  } catch (error) {
    exportLoad.value = false;
  }
};

const getApi = async (query) => {
  const { data } = await getReportPaymentList(query);
  return { data: data.data, total: data.total };
};

const getSearchQuery = (query) => {
  if (query.validityDateRange) {
    query.startDateStart = query.validityDateRange[0];
    query.startDateEnd = query.validityDateRange[1];
    delete query.validityDateRange;
  }
  const sort = {
    合同开始日期: "startDate",
    合同结束日期: "endDate",
  };
  query.sort = sort[query.sort] ?? null;
  return query;
};

const {
  dataSource,
  loadTable,
  searchQuery,
  handleTableChange,
  getList,
  search,
  formState,
  reset,
  exportUrl,
} = useTable(getApi, {}, { getSearchQuery: getSearchQuery });

onActivated(() => getList());

const columns = [
  {
    title: "序号",
    dataIndex: "index",
    key: "index",
    width: 56,
    customRender: ({ index }) => {
      return index + 1;
    },
  },
  {
    title: "合同号",
    dataIndex: "合同号",
    key: "合同号",
    width: 168,
    ellipsis: true,
  },
  {
    title: "合同名称",
    dataIndex: "合同名称",
    key: "合同名称",
    width: 200,
    ellipsis: true,
  },
  {
    title: "我方主体",
    dataIndex: "我方主体",
    key: "我方主体",
    width: 250,
    ellipsis: true,
  },
  {
    title: "对方客商",
    dataIndex: "对方客商",
    key: "对方客商",
    width: 250,
    ellipsis: true,
  },
  { title: "品牌", dataIndex: "品牌", key: "品牌", width: 120 },
  {
    title: "合同开始日期",
    dataIndex: "合同开始日期",
    key: "合同开始日期",
    width: 120,
    sorter: true,
  },
  {
    title: "合同结束日期",
    dataIndex: "合同结束日期",
    key: "合同结束日期",
    width: 120,
    sorter: true,
  },
  {
    title: "合同总额(元)",
    dataIndex: "合同总额",
    key: "合同总额",
    width: 150,
  },
  {
    title: "已支付金额(元)",
    dataIndex: "已支付金额",
    key: "已支付金额",
    width: 150,
  },
  {
    title: "未支付金额(元)",
    dataIndex: "未支付金额",
    key: "未支付金额",
    width: 140,
  },
  {
    title: "合同经办人",
    dataIndex: "合同经办人",
    key: "合同经办人",
    width: 100,
  },
];
</script>
<style scoped lang="scss">
.payment {
  .card_table.ant-card {
    padding: 24px;
  }
}
</style>
