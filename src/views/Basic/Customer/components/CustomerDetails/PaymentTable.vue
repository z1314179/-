<template>
  <div class="payment-table">
    <a-table
      row-key="id"
      :columns="columns"
      :data-source="dataSource"
      :loading="loadTable"
      :pagination="searchQuery"
      @change="handleTableChange"
      :scroll="{ x: 960 }"
    >
    </a-table>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { getCustomerDetail } from "@/api/Basic/customer.js";
import useTable from "@/hook/useTable.js";
import hookMap from "@/views/Basic/hookMap";

const { tradeStatusList } = hookMap();
const route = useRoute();
const router = useRouter();
const getSearchQuery = (query) => {
  return { ...query, id: route.query.id };
};
const getApi = async (query) => {
  const { data } = await getCustomerDetail(query);
  const total = data.contractBillList?.total || 0;
  const list = data.contractBillList?.data || [];
  return { data: list || [], total };
};

const {
  nFormat,
  dataSource,
  loadTable,
  searchQuery,
  handleTableChange,
  leChange,
  getList,
  toRouterQuery,
} = useTable(getApi, {}, { getSearchQuery: getSearchQuery });

onMounted(() => getList());

const columns = [
  {
    title: "交易编号",
    dataIndex: "billNo",
    key: "billNo",
    width: 160,
  },
  {
    title: "合同编号",
    dataIndex: "contractNo",
    key: "contractNo",
    width: 160,
  },
  {
    title: "交易日期",
    dataIndex: "dueDate",
    key: "dueDate",
    width: 160,
  },
  {
    title: "金额(元)",
    dataIndex: "amount",
    key: "amount",
    width: 160,
    customRender: ({ record }) => nFormat(record.amount) || "0.00",
  },
  {
    title: "类型",
    dataIndex: "planType",
    key: "planType",
    width: 160,
    customRender: ({ record }) => (record.planType === 1 ? "付款" : "收款"),
  },
  {
    title: "状态",
    dataIndex: "payStatus",
    key: "payStatus",
    width: 160,
    customRender: ({ record }) => tradeStatusList.obj[record.payStatus]?.label,
  },
];
</script>

<style lang="scss" scoped>
.payment-table {
  max-width: 1800px;
}
</style>
