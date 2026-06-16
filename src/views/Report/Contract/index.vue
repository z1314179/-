<template>
  <div class="page-content pd-t-small report-contract">
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
        <a-form-item label="合同分类">
          <a-select
            class="select-placeholder"
            allow-clear
            v-model:value="formState.contractCategory"
            :options="categoryOptionsWithAll.arr"
            placeholder="全部"
          />
        </a-form-item>
        <a-form-item label="合同状态">
          <a-select
            class="select-placeholder"
            max-tag-count="responsive"
            mode="multiple"
            allow-clear
            v-model:value="formState.status"
            :options="contractStatusList.arr"
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
        <a-form-item label="合同金额">
          <groupNum
            v-model:start="formState.amountMin"
            v-model:end="formState.amountMax"
            :precision="2"
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
import groupNum from "@/components/system/groupNum.vue";
import useTable from "@/hook/useTable.js";
import {
  getReportContractList,
  exportReportContractList,
} from "@/api/Report/contract.js";
import contractHookMap from "@/views/Contract/hookMap.js";
import hookMap from "@/views/Report/hookMap.js";

defineOptions({ name: "ReportContractPage" });

const { categoryOptionsWithAll, subjectOptionsWithAll } = contractHookMap([1]);
const { contractStatusList } = hookMap();

const exportLoad = ref(false);

const handleExport = async () => {
  if (exportLoad.value) return message.warning("正在导出中，请勿重复点击");
  exportLoad.value = true;
  const query = getSearchQuery({ ...formState.value });
  try {
    const res = await exportReportContractList(query);
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
  const { data } = await getReportContractList(query);
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
    签约日期: "signDate",
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
  { title: "合同状态", dataIndex: "合同状态", key: "合同状态", width: 120 },
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
    title: "签约日期",
    dataIndex: "签约日期",
    key: "签约日期",
    width: 120,
    sorter: true,
  },
  {
    title: "合同金额(元)",
    dataIndex: "合同金额",
    key: "合同金额",
    width: 120,
  },
  { title: "合同分类", dataIndex: "合同分类", key: "合同分类", width: 120 },
  { title: "合同类型", dataIndex: "合同属性", key: "合同属性", width: 80 },
  {
    title: "合同签署人",
    dataIndex: "合同签署人",
    key: "合同签署人",
    width: 100,
  },
  { title: "经办人", dataIndex: "合同经办人", key: "合同经办人", width: 100 },
];
</script>

<style scoped lang="scss">
.report-contract {
  .card_table.ant-card {
    padding: 24px;
  }
}
</style>
