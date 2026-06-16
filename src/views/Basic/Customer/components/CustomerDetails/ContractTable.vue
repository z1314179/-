<template>
  <div class="contract-table">
    <a-table
      row-key="id"
      :columns="columns"
      :data-source="dataSource"
      :loading="loadTable"
      :pagination="searchQuery"
      @change="handleTableChange"
      :scroll="{ x: 960 }"
    >
      <template #bodyCell="{ column, text, record }">
        <template v-if="column.dataIndex === 'contractNo'">
          <a-button
            type="link"
            class="oper-link pd-l-small"
            @click="
              toRouterQuery('/contract/lifecycle/detail', { id: record.id })
            "
          >
            {{ record.contractNo }}
          </a-button>
        </template>
        <template v-if="column.dataIndex === 'status'">
          <!-- <span class="tag_base" :class="contractStatusObj[text]?.class || ''">
            {{ contractStatusObj[text]?.label || "-" }}
          </span> -->
          {{ contractStatusObj[text]?.label || "-" }}
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { getCustomerDetail } from "@/api/Basic/customer.js";
import { contractStatusFn } from "@/utils/codeMap/basic.js";
import useTable from "@/hook/useTable.js";

const { contractStatusObj } = contractStatusFn();
const route = useRoute();
const router = useRouter();
const getSearchQuery = (query) => {
  return { ...query, id: route.query.id };
};
const getApi = async (query) => {
  const { data } = await getCustomerDetail(query);
  const total = data.contractList?.total || 0;
  const list = data.contractList?.data || [];
  return { data: list || [], total };
};

const {
  dataSource,
  loadTable,
  searchQuery,
  handleTableChange,
  leChange,
  getList,
  toRouterQuery,
  nFormat,
} = useTable(getApi, {}, { getSearchQuery: getSearchQuery });

onMounted(() => getList());

const columns = [
  {
    title: "合同编号",
    dataIndex: "contractNo",
    key: "contractNo",
    width: 200,
  },
  {
    title: "合同名称",
    dataIndex: "contractName",
    key: "contractName",
    width: 200,
  },
  {
    title: "签订日期",
    dataIndex: "signDate",
    key: "signDate",
    width: 200,
  },
  {
    title: "金额(元)",
    dataIndex: "amountTaxIncluded",
    key: "amountTaxIncluded",
    width: 200,
    customRender: ({ record }) => nFormat(record.amountTaxIncluded) || "0.00",
  },
  {
    title: "合同状态",
    dataIndex: "status",
    key: "status",
    width: 200,
  },
];
</script>

<style lang="scss" scoped>
.contract-table {
  max-width: 1750px;

  .default-tag {
    font-size: 12px;

    span {
      border-radius: 4px;
      padding: 1px 8px;
      min-width: 52px;
      text-align: center;
    }
  }
}
</style>
