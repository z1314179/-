<template>
  <div class="page-content">
    <a-card class="pd-0">
      <SearchCard :is-exp="false">
        <a-form layout="inline" autocomplete="off">
          <a-form-item label="角色名称">
            <a-input v-model:value="formState.name" :maxlength="50" allow-clear placeholder="请输入" />
          </a-form-item>
          <a-form-item label="">
            <a-button type="primary circle-4" @click="search">查 询</a-button>
          </a-form-item>
        </a-form>
      </SearchCard>
    </a-card>
    <a-card :bordered="false" class="card_table mg-t-small">
      <div class="flex justify-between">
        <div>
          <a-button class="mg-t-medium" v-if="PERM('角色启用')"  type="primary" ghost :disabled="isStatusBtnDisabled(1)"
            @click="handleBatchStatus(1)">启用</a-button>
          <a-button class="mg-l-small mg-t-medium" v-if="PERM('角色停用')" type="primary" ghost :disabled="isStatusBtnDisabled(0)"
            @click="handleBatchStatus(0)">停用</a-button>
        </div>
        <a-button class="mg-t-medium" v-if="PERM('角色新增')" type="primary" @click="addRoleBtn">新增角色</a-button>
      </div>
      <a-table class="mg-t-medium" row-key="id" :row-selection="rowSelection" :scroll="{ x: 720 }" :pagination="searchQuery"
        :dataSource="dataSource" :columns="columns" :loading="loadTable" @change="handleTableChange">
        <template #bodyCell="{ record, column, index }">
          <template v-if="column.key === 'seq'">
            {{ (searchQuery.current - 1) * searchQuery.pageSize + index + 1 }}
          </template>
          <template v-if="column.key === 'type'">
            <span :class="record.type === 1 ? '' : 'role-status-off'">
              {{ record.type === 1 ? "启用" : "停用" }}
            </span>
          </template>
          <template v-if="column.key === 'oper'">
            <a-button type="link" class="mg-r-small" @click="lookBtn(record)">查看</a-button>
            <a-button v-if="PERM('角色编辑')" type="link" class="mg-r-small" :disabled="record.isAdmin == 1"
              @click="editBtn(record)">编辑</a-button>
            <a-popconfirm v-if="PERM('角色删除')" :disabled="record.isAdmin == 1" title="是否删除该角色？" ok-text="确定"
              placement="topRight" cancel-text="取消" @confirm="delBtn(record.id)">
              <a-button :disabled="record.isAdmin == 1" type="link" class="mg-r-small">删除</a-button>
            </a-popconfirm>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
  <roleEdit v-model:roleOpen="roleOpen" :config="configDraw" @change="init"></roleEdit>
  <associatedUsers v-model:associatedOpen="associatedOpen" :config="configDraw" @change="init"></associatedUsers>
</template>

<script setup>
import { message } from "ant-design-vue";
import roleEdit from "./common/roleEdit.vue";
import associatedUsers from "./common/associatedUsers.vue";
import useTable from "@/hook/useTable.js";
import { getTableList, delRole, batchChangeType } from "@/api/roles";
import { ref, reactive, computed, onActivated, inject } from "vue";

const PERM = inject("PERM");
import SearchCard from "@/components/system/SearchCard.vue";
defineOptions({
  name: "basicInfo/roles",
});
const roleOpen = ref(false);
const associatedOpen = ref(false);
const selectedRows = ref([]);
const configDraw = reactive({
  type: "add",
  id: "",
  roleList: [],
  usersList: [],
});
const associatedUsersBtn = (row) => {
  configDraw.id = row.id;
  configDraw.usersList = row.users;
  associatedOpen.value = true;
};
const delBtn = async (id) => {
  const res = await delRole({ id: id });
  if (res.errno == 0) {
    init('del');
    message.success("删除成功");
  }
};
const editBtn = (row) => {
  configDraw.type = "edit";
  configDraw.id = row.id;
  configDraw.roleList = dataSource.value;
  roleOpen.value = true;
};
const lookBtn = (row) => {
  configDraw.type = "look";
  configDraw.id = row.id;
  configDraw.roleList = dataSource.value;
  roleOpen.value = true;
};
const addRoleBtn = () => {
  configDraw.type = "add";
  configDraw.id = "";
  configDraw.roleList = dataSource.value;
  roleOpen.value = true;
};
function init(type) {
  getList(type);
}

const getApi = async (query) => {
  const { data } = await getTableList(query);
  return { data: data.data, total: data.total };
};
const { loadTable, formState, search, searchQuery, dataSource, getList, handleTableChange } =
  useTable(getApi);

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRows.value.map((e) => e.id),
  onChange: (_keys, rows) => {
    selectedRows.value = rows;
  },
  getCheckboxProps: (record) => ({
    disabled: record.isAdmin === 1,
  }),
}));

const isStatusBtnDisabled = (type) => {
  if (!selectedRows.value.length) return true;
  if (type === 1) {
    return selectedRows.value.every((e) => e.type === 1);
  }
  return selectedRows.value.every((e) => e.type === 0);
};

const handleBatchStatus = async (type) => {
  const rows = selectedRows.value.filter((e) => e.type !== type);
  if (!rows.length) return;
  const res = await batchChangeType({ ids: rows.map((e) => e.id), type });
  if (res.errno === 0) {
    message.success("操作成功");
    selectedRows.value = [];
    getList();
  }
};

const columns = [
  {
    title: "序号",
    key: "seq",
    width: 40,
    align: "center",
  },
  {
    title: "角色编码",
    dataIndex: "roleCode",
    width: 120,
    ellipsis: true,
    customRender: ({ record }) => record.roleCode || "-",
  },
  {
    title: "角色名称",
    dataIndex: "name",
    width: 160,
    ellipsis: true,
  },
  {
    title: "状态",
    dataIndex: "type",
    key: "type",
    width: 80,
  },
  {
    title: "操作",
    key: "oper",
    width: 120,
  },
];
onActivated(() => {
  init();
});
</script>

<style lang="scss" scoped>
.role-status-off {
  color: rgba(0, 0, 0, 0.25);
}
</style>
