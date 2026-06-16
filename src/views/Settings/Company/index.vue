<template>
  <div class="page-content">
    <a-card :bordered="false" class="card_table mg-t-small">
      <div class="flex justify-end mg-b-medium mg-t-medium">
        <a-input-search
          v-model:value="formState.companyName"
          :maxlength="200"
          allowClear
          placeholder="请输入公司名称查询"
          style="width: 240px"
          @search="search"
          class="input_search"
        />
        <a-button
          type="primary"
          class="mg-l-small"
          @click="onAdd"
          v-if="PERM('公司新增')"
          >新增公司</a-button
        >
      </div>
      <a-table
        row-key="id"
        :columns="columns"
        :data-source="dataSource"
        :loading="loadTable"
        :pagination="searchQuery"
        @change="handleTableChange"
        :scroll="{ x: 1520 }"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'seq'">
            {{ (searchQuery.current - 1) * searchQuery.pageSize + index + 1 }}
          </template>
          <template v-if="column.dataIndex === 'companyCode'">
            <a-tooltip :title="record.companyCode">
              <span>
                {{ record.companyCode }}
              </span>
            </a-tooltip>
          </template>
          <template v-if="column.dataIndex === 'companyName'">
            <a-tooltip :title="record.companyName">
              <span>
                {{ record.companyName }}
              </span>
            </a-tooltip>
          </template>
          <template v-if="column.dataIndex === 'parentCompany'">
            <a-tooltip :title="record.parentCompany?.companyName">
              <span>
                {{ record.parentCompany?.companyName }}
              </span>
            </a-tooltip>
          </template>
          <template v-if="column.key === 'status'">
            <span :class="record.status === 1 ? 'status-on' : 'status-off'">
              <a-switch
                :checked="record.status == 1"
                @click="handleStatus(record)"
                :disabled="
                  !(
                    (PERM('公司生效') && record.status == 0) ||
                    (PERM('公司失效') && record.status == 1)
                  )
                "
              />
            </span>
          </template>
          <template v-if="column.key === 'oper'">
            <a-space :size="8">
              <a-button type="link" @click="onDetails(record)"> 详情 </a-button>
              <a-button
                type="link"
                @click="onEdit(record)"
                v-if="PERM('公司编辑')"
              >
                编辑
              </a-button>
              <a-popconfirm
                placement="top"
                ok-text="确定"
                cancel-text="取消"
                @confirm="onDelete(record)"
                v-if="PERM('公司删除')"
              >
                <template #title>
                  <div>你确定要删除吗？</div>
                </template>
                <a-button type="link" v-if="PERM('公司删除')">删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
import { onActivated, inject } from "vue";
import { message } from "ant-design-vue";
import {
  getCompanyList,
  delCompany,
  updateStatus,
} from "@/api/Settings/company.js";
import SearchCard from "@/components/system/SearchCard.vue";
import useTable from "@/hook/useTable.js";

defineOptions({ name: "SettingsCompanyPage" });

const PERM = inject("PERM");

const onAdd = () => {
  toRouterQuery("/settings/company/edit", { mode: "新增公司" });
};

const onEdit = (record) => {
  toRouterQuery("/settings/company/edit", { id: record.id });
};

const onDetails = (record) => {
  toRouterQuery("/settings/company/CompanyDetails", { id: record.id });
};

const onDelete = async (record) => {
  const res = await delCompany({ id: record.id });
  if (res.errno === 0) {
    message.success("删除成功");
    getList();
  }
};

const handleStatus = async (record) => {
  const res = await updateStatus({ id: record.id });
  if (res.errno === 0) {
    message.success("设置成功");
    record.status = record.status === 1 ? 0 : 1;
  }
};

const getApi = async (query) => {
  const { data } = await getCompanyList(query);
  return { data: data.data, total: data.total };
};
const getSearchQuery = (query) => query;

const {
  dataSource,
  loadTable,
  searchQuery,
  handleTableChange,
  getList,
  search,
  formState,
  toRouterQuery,
} = useTable(getApi, {}, { getSearchQuery });

onActivated(() => getList());

const columns = [
  {
    title: "序号",
    dataIndex: "seq",
    key: "seq",
    width: 52,
  },
  {
    title: "公司编码",
    dataIndex: "companyCode",
    key: "companyCode",
    width: 300,
    ellipsis: true,
  },
  {
    title: "公司名称",
    dataIndex: "companyName",
    key: "companyName",
    width: 500,
    ellipsis: true,
  },
  {
    title: "上级公司",
    dataIndex: "parentCompany",
    key: "parentCompany",
    width: 500,
    ellipsis: true,
  },
  {
    title: "状态",
    dataIndex: "status",
    key: "status",
    width: 200,
    customRender: ({ record }) => (record.status === 1 ? "生效" : "失效"),
  },
  { title: "操作", key: "oper", width: 268, fixed: "right" },
];
</script>

<style lang="scss" scoped>
.input_search {
  :deep(.ant-input-affix-wrapper) {
    &:hover {
      border-color: #d9d9d9;
      border-right: 0;
    }
  }
  :deep(.ant-input-search-button) {
    border-left: 0px;
    &:hover {
      color: rgba(0, 0, 0, 0.45);
      border-color: #d9d9d9;
    }
  }
}
</style>
