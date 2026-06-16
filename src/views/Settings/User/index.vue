<template>
  <div class="page-content">
    <a-card class="pd-0">
      <SearchCard :is-exp="false">
        <a-form layout="inline" autocomplete="off" :label-col="{ style: { width: '70px' } }">
          <a-form-item label="公司名称">
            <a-select v-model:value="formState.companyIds" allow-clear class="select-placeholder" placeholder="全部"
              :options="companyListAll.arr" :field-names="{ label: 'companyName', value: 'id' }" style="width: 259px" />
          </a-form-item>
          <a-form-item label="用户名">
            <a-input v-model:value="formState.key" :maxlength="50" allow-clear placeholder="请输入" />
          </a-form-item>
        </a-form>
        <template #right>
          <a-button class="mg-l-1 circle-4" @click="reset">重 置</a-button>
          <a-button class="mg-l-1" type="primary circle-4" @click="search">查 询</a-button>
        </template>
      </SearchCard>
    </a-card>
    <div class="flex-1 mg-t-small flex  users-class" style="min-height:0">
      <a-card class="users-left mg-r-medium">
        <a-tree ref="treeRef" class="is-tree" :tree-data="deptList" :fieldNames="replaceFields" :show-line="true"
          v-model:expandedKeys="expandedKeys" v-model:selectedKeys="selectedDeptKeys" @select="treeSelect"
          default-expand-all>
          <template #switcherIcon="{ expanded }">
            <CaretDownOutlined v-if="expanded" style="font-size: 12px;" />
            <CaretRightOutlined v-else style="font-size: 12px;" />
          </template>
          <template #title="row">
            <div class="flex is-title">
              <div class="name flex align-center" :class="{ 'is-dept-highlight': isDeptParentHighlight(row.data.id) }">
                <i class="iconfont icon-bumen" style="margin-right: 4px;" />
                <span>{{ row.data.name }}（{{ row.data.count }}）</span>
              </div>
              <!-- 位置 -->
              <a-dropdown v-if="row.data.name" class="is-overlay" overlayClassName="is-overlay-class"
                @click="getEvent($event)">
                <MoreOutlined />
                <template #overlay>
                  <a-menu @click="onClick($event, row.data)">
                    <a-menu-item key="add" v-if="row.data.level < 4">添加子部门</a-menu-item>
                    <a-menu-item key="update">编辑部门</a-menu-item>
                    <a-menu-item key="del" v-if="!row.data.count && !row.data.children?.length">删除部门</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
          </template>
        </a-tree>
      </a-card>
      <a-card class="users-right pd-y-medium pd-x-large card_table">
        <div class="flex justify-between ">
          <div>
            <a-button class="mg-t-medium" v-if="PERM('用户启用')" type="primary" ghost :disabled="isStatusBtnDisabled(1)"
              @click="handleBatchStatus(1)">启用</a-button>
            <a-button class="mg-t-medium mg-l-small" v-if="PERM('用户停用')" type="primary" ghost
              :disabled="isStatusBtnDisabled(0)" @click="handleBatchStatus(0)">停用</a-button>
          </div>
          <a-button class="mg-t-medium" v-if="PERM('用户新增')" type="primary" @click="addRoleBtn">添加用户</a-button>
        </div>
        <a-table class="mg-t-medium" @change="handleTableChange" row-key="id" :row-selection="rowSelection"
          :pagination="searchQuery" :dataSource="dataSource" :scroll="{ x: 900 }" :columns="columns">
          <template #bodyCell="{ record, column, index }">
            <template v-if="column.key === 'seq'">
              {{ (searchQuery.current - 1) * searchQuery.pageSize + index + 1 }}
            </template>
            <template v-if="column.key === 'type'">
              <span :class="record.type === 1 ? '' : 'user-status-off'">
                {{ record.type === 1 ? "启用" : "停用" }}
              </span>
            </template>
            <template v-if="column.key === 'companyIds'">
              {{ formatCompanyDisplay(record) }}
            </template>
            <template v-if="column.key === 'organizationIds'">
              {{ formatNamesFromList(record.organizationIds) }}
            </template>
            <template v-if="column.key === 'oper'">
              <a-button type="link" class="mg-r-small" @click="lookBtn(record)">查看</a-button>
              <a-button v-if="PERM('用户编辑')" class="mg-r-small" :disabled="record.isAdmin == 1" type="link"
                @click="editBtn(record)">编辑</a-button>
              <a-popconfirm v-if="PERM('用户删除')" :disabled="record.isAdmin == 1" title="你确定要删除吗?" ok-text="确定"
                placement="topRight" cancel-text="取消" @confirm="delBtn('user', record.id)">
                <a-button :disabled="record.isAdmin == 1" type="link" class="pd-l-small">删除</a-button>
              </a-popconfirm>
            </template>
          </template>
        </a-table>
      </a-card>
      <userModal v-model:visible="userOpen" :deptList="deptList" :config="modelConfig"
        :companyListAll="companyListAll.arr" :dataPermissionsList="dataPermissionsList.arr" @change="init">
      </userModal>
      <deptModal v-model:open="deptOpen" :deptInfo="deptInfo" @change="getTree" />
      <div class="overlay-page" v-if="loadTable"></div>
    </div>
  </div>
</template>
<script setup>
import useTable from "@/hook/useTable.js";
import hookMap from "../hookMap.js";
import userModal from "./common/userModal.vue";
import deptModal from "./common/deptModal.vue";
import SearchCard from "@/components/system/SearchCard.vue";

import {
  getDepartmentList,
  getTableList,
  delDepartment,
  delUser,
  batchChangeType,
} from "@/api/users";
import { reactive, computed, ref, onActivated, inject } from "vue";

const PERM = inject("PERM");
import { message } from "ant-design-vue";
import { CaretDownOutlined, CaretRightOutlined, MoreOutlined } from "@ant-design/icons-vue";
defineOptions({
  name: "basicInfo/users",
});
const { companyListAll, dataPermissionsList } = hookMap({ isCompany: true });
const userOpen = ref(false);
const deptOpen = ref(false);
const deptInfo = ref({});
const modelConfig = reactive({
  type: "add",
  depOption: [],
  id: "",
  depId: "",
});
let deptList = ref([]);
const expandedKeys = ref([]);
const selectedDeptKeys = ref([]);
const treeRef = ref();
const replaceFields = {
  children: "children",
  title: "name",
  key: "id",
};
const isEvent = ref();
const getEvent = (e) => {
  isEvent.value = e;
};

const buildDeptParentMap = (nodes, parentId = null, map = {}) => {
  nodes.forEach((node) => {
    if (node.id != null) {
      map[String(node.id)] = parentId != null ? String(parentId) : null;
    }
    if (node.children?.length) {
      buildDeptParentMap(node.children, node.id, map);
    }
  });
  return map;
};

const deptParentMap = computed(() => buildDeptParentMap(deptList.value));

const isDeptParentHighlight = (id) => {
  if (id == null) return false;
  const selectedId = selectedDeptKeys.value[0];
  if (selectedId == null || selectedId === "") return false;

  const directParentId = deptParentMap.value[String(selectedId)];
  if (directParentId == null) return false;
  if (String(id) !== directParentId) return false;

  return deptParentMap.value[directParentId] != null;
};

const getTree = () => {
  getDepartmentList().then(async (res) => {
    const data = res.data || [];
    deptList.value = await handleTreeNode(data);
    if (formState.value.organizationId != null) {
      selectedDeptKeys.value = [formState.value.organizationId];
    }
  });
};

const handleTreeNode = (arr, level = 0) => {
  arr.forEach((e) => {
    e.level = level;
    if (e.children && e.children.length) {
      expandedKeys.value.push(e.id);
      handleTreeNode(e.children, level + 1);
    }
  });
  return arr;
};

const onClick = async (e, row) => {
  switch (e.key) {
    case "add":
      deptInfo.value = { ...row, type: 'add' };
      deptOpen.value = true;

      break;
    case "update":
      deptInfo.value = { ...row, type: 'update' };
      deptOpen.value = true;
      break;
    case "edit":
      deptInfo.value = { ...row, type: 'update' };
      deptOpen.value = true;
      break;
    case "del":
      delBtn("dep", row.id);
      break;
  }
};

const treeSelect = (keys) => {
  selectedDeptKeys.value = keys;
  formState.value.organizationId = keys[0];
  search();
};
const addRoleBtn = () => {
  modelConfig.type = "add";
  modelConfig.depOption = deptList.value;
  modelConfig.depId = formState.value.organizationId;
  modelConfig.id = "";
  userOpen.value = true;
};
const lookBtn = (row) => {
  modelConfig.type = "look";
  modelConfig.depOption = deptList.value;
  modelConfig.id = row.id;
  userOpen.value = true;
};
const editBtn = (row) => {
  modelConfig.type = "edit";
  modelConfig.depOption = deptList.value;
  modelConfig.id = row.id;
  userOpen.value = true;
};
const delBtn = async (type, id) => {
  let res = {};
  if (type == "dep") {
    res = await delDepartment({ id: id });
  } else {
    res = await delUser({ id: id });
  }
  if (res.errno == 0) {
    init('del');
    message.success("删除成功");
  }
};
const init = async (type) => {
  await getTree();
  await getList(type);
};

const getApi = async (query) => {
  const { data } = await getTableList(query);
  return { data: data.data, total: data.total };
};
const { loadTable, searchQuery, handleTableChange, formState, search, reset, dataSource, getList } =
  useTable(getApi);

const selectedRows = ref([]);

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

const formatNamesFromList = (list) => {
  if (!Array.isArray(list) || !list.length) return "-";
  const names = list.map((item) => (typeof item === "object" ? item?.name : item)).filter(Boolean);
  return names.length ? names.join(",") : "-";
};

const formatCompanyDisplay = (record) => {
  if (typeof record.companyNames === "string" && record.companyNames) {
    return record.companyNames;
  }
  return formatNamesFromList(record.companyIds);
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
    width: 60,
    align: "center",
  },
  {
    title: "公司",
    dataIndex: "companyIds",
    key: "companyIds",
    width: 200,

  },
  {
    title: "部门",
    dataIndex: "organizationIds",
    key: "organizationIds",
    width: 120,

  },
  {
    title: "用户编码",
    dataIndex: "userCode",
    width: 100,

    customRender: ({ record }) => record.userCode || "-",
  },
  {
    title: "用户名",
    dataIndex: "userName",
    width: 120,

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
    fixed: "right",
  },
];
onActivated(() => {
  init();
});
</script>
<style lang="scss" scoped>
.users-class {
  // flex-direction: inherit;

  .users-left {
    width: 355px;
    height: 100%;
    overflow: auto;

    :deep(.ant-tree-show-line) {
      .ant-tree-indent-unit::before {
        border-color: #f0f0f0;
      }
    }

    :deep(.is-tree) {
      .ant-tree-treenode {
        padding-bottom: 0;
        width: -webkit-fill-available;
        font-weight: 400;
        font-size: 14px;
        color: rgba(0, 0, 0, 0.6);

        &:nth-child(1) {
          font-weight: 500;
          font-size: 14px;
          color: #4A4B4D;
        }

      }

      .ant-tree-switcher {
        line-height: 38px;
      }

      .ant-tree-node-content-wrapper {
        flex: 1;
        padding: 6px 4px;

        .iconfont {
          color: #4A4B4D !important;
        }

        &:hover {
          background: rgba(22, 80, 255, 0.04);
          border-radius: 2px;
        }
      }

      .anticon-file {
        svg {
          display: none;
        }
      }

      .ant-tree-treenode-selected {
        font-weight: 400;
        font-size: 14px;
        color: rgba(0, 0, 0, 0.9);
      }

    }

    .is-title {
      .name {
        flex: 1;
      }

      .is-dept-highlight {
        font-weight: 400;
        font-size: 14px;
        color: var(--color-primary);

        .iconfont {
          color: var(--color-primary) !important;
        }
      }
    }
  }

  .users-right {
    flex: 1;
    height: 100%;
    background: #fff;
    min-width: 0;
    border-radius: 6px;
  }
}

.user-status-off {
  color: rgba(0, 0, 0, 0.25);
}
</style>
