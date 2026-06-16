<template>
  <div class="page-content borrowing-history">
    <SearchCard :is-exp="false">
      <a-form
        layout="inline"
        autocomplete="off"
        :label-col="{ style: { width: '98px' } }"
      >
        <a-form-item label="借阅开始日期">
          <a-range-picker
            v-model:value="formState.dateRange"
            value-format="YYYY-MM-DD"
            :placeholder="['开始日期', '结束日期']"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="借阅人">
          <a-input
            v-model:value="formState.applicantUserName"
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
        :scroll="{ x: 1624 }"
      >
        <template #bodyCell="{ column, record }">
          <template
            v-if="
              [
                '借阅合同号',
                '合同名称',
                '我方主体',
                '对方客商',
                '用途',
                '借阅理由',
              ].includes(column.dataIndex)
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
import {
  getReportBorrowingHistoryList,
  exportReportBorrowingHistoryList,
} from "@/api/Report/borrowingHistory.js";

defineOptions({ name: "ReportBorrowingHistoryPage" });

const exportLoad = ref(false);

const handleExport = async () => {
  if (exportLoad.value) return message.warning("正在导出中，请勿重复点击");
  exportLoad.value = true;
  const query = getSearchQuery({ ...formState.value });
  try {
    const res = await exportReportBorrowingHistoryList(query);
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
  const { data } = await getReportBorrowingHistoryList(query);
  return { data: data.data, total: data.total };
};

const getSearchQuery = (query) => {
  if (query.dateRange) {
    query.borrowStartDateStart = query.dateRange[0];
    query.borrowStartDateEnd = query.dateRange[1];
    delete query.dateRange;
  }
  const sort = {
    借阅开始日期: "borrowStartDate",
    借阅结束日期: "borrowEndDate",
    借阅日期: "borrowDate",
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
  { title: "借阅人", dataIndex: "借阅人", key: "借阅人", width: 100 },
  {
    title: "借阅合同",
    dataIndex: "借阅合同号",
    key: "借阅合同号",
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
    width: 200,
    ellipsis: true,
  },
  {
    title: "对方客商",
    dataIndex: "对方客商",
    key: "对方客商",
    width: 200,
    ellipsis: true,
  },
  {
    title: "借阅开始日期",
    dataIndex: "借阅开始日期",
    key: "借阅开始日期",
    width: 120,
    sorter: true,
  },
  {
    title: "借阅结束日期",
    dataIndex: "借阅结束日期",
    key: "借阅结束日期",
    width: 120,
    sorter: true,
  },
  {
    title: "借阅日期",
    dataIndex: "借阅日期",
    key: "借阅日期",
    width: 120,
    sorter: true,
    customRender: ({ text }) => {
      return text?.split(" ")[0];
    },
  },
  {
    title: "用途",
    dataIndex: "用途",
    key: "用途",
    width: 200,
    ellipsis: true,
  },
  {
    title: "借阅理由",
    dataIndex: "借阅理由",
    key: "借阅理由",
    width: 340,
    ellipsis: true,
  },
];
</script>
<style scoped lang="scss">
.borrowing-history {
  .card_table.ant-card {
    padding: 24px;
  }
}
</style>
