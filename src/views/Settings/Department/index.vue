<template>
  <div class="page-content">
    <SearchCard :is-exp="false">
      <a-form
        layout="inline"
        autocomplete="off"
        :label-col="{ style: { width: '70px' } }"
      >
        <a-form-item label="部门名称">
          <a-input
            v-model:value="formState.name"
            :maxlength="50"
            allow-clear
            placeholder="请输入"
          />
        </a-form-item>
      </a-form>
      <template #right>
        <a-button class="mg-l-1" type="primary" @click="search">搜 索</a-button>
      </template>
    </SearchCard>
    <a-card :bordered="false" class="card_table mg-t-small">
      <div class="flex justify-end mg-b-medium mg-t-medium">
        <a-button type="primary" @click="onAdd">新 增</a-button>
      </div>
      <a-table
        row-key="id"
        :columns="columns"
        :data-source="dataSource"
        :loading="loadTable"
        :pagination="searchQuery"
        :scroll="{ x: 1100 }"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'seq'">
            {{ (searchQuery.current - 1) * searchQuery.pageSize + index + 1 }}
          </template>
          <template v-if="column.key === 'status'">
            <a-tag v-if="record.status === 1" color="success">生效</a-tag>
            <a-tag v-else color="error">失效</a-tag>
          </template>
          <template v-if="column.key === 'oper'">
            <a-space :size="8">
              <a-button type="link" @click="onEdit(record)">编辑</a-button>
              <a-button type="link" @click="handleRename(record)">
                重命名
              </a-button>
              <a-popconfirm
                placement="top"
                ok-text="确定"
                cancel-text="取消"
                @confirm="onDelete(record)"
              >
                <template #title>
                  <div>你确定要删除吗？</div>
                </template>
                <a-button type="link">删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
import { onActivated } from "vue";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import SearchCard from "@/components/system/SearchCard.vue";
import useTable from "@/hook/useTable.js";

defineOptions({ name: "SettingsDepartmentPage" });

const router = useRouter();

const onAdd = () => {
  toRouterQuery("/settings/department/edit");
};

const onEdit = (record) => {
  toRouterQuery("/settings/department/edit", { id: record.id });
};

const onDelete = async (record) => {
  const res = await delCompany(record.id);
  if (res.errno === 0) {
    message.success("删除成功");
    getList();
  }
};

const handleRename = (record) => {
  message.info("生效功能待对接");
};
const getApi = async (query) => {
  // const { data } = await getDepartmentPageList(query);
  const data = {
    data: [
      {
        id: 1,
        code: "001",
        companyName: "公司1",
        level: "一级",
        name: "部门1",
        parentName: "上级部门1",
        status: 1,
      },
    ],
    total: 1,
  };
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
} = useTable(
  getApi,
  {
    pageSize: 10,
    current: 1,
    showTotal: (total) => `共 ${total} 条记录`,
  },
  { getSearchQuery },
);
onActivated(() => getList());

const columns = [
  { title: "序号", key: "seq", width: 72, align: "center", fixed: "left" },
  { title: "部门编码", dataIndex: "code", key: "code", width: 100 },
  {
    title: "所属公司",
    dataIndex: "companyName",
    key: "companyName",
    ellipsis: true,
    width: 220,
  },
  { title: "部门级别", dataIndex: "level", key: "level", width: 110 },
  {
    title: "部门名称",
    dataIndex: "name",
    key: "name",
    ellipsis: true,
    width: 140,
  },
  {
    title: "上级部门",
    dataIndex: "parentName",
    key: "parentName",
    ellipsis: true,
    width: 140,
  },
  { title: "状态", dataIndex: "status", key: "status", width: 100 },
  { title: "操作", key: "oper", width: 260, fixed: "right" },
];
</script>

<style scoped>
.oper-active {
  color: #52c41a;
}

.oper-inactive {
  color: #fa8c16;
}
</style>
