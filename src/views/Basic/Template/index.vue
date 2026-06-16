<template>
  <div class="page-content">
    <SearchCard :is-exp="false">
      <a-form layout="inline" autocomplete="off" :label-col="{ style: { width: '70px' } }">
        <a-form-item label="模板名称">
          <a-input v-model:value="formState.key" :maxlength="50" allow-clear placeholder="请输入" />
        </a-form-item>
        <a-form-item label="模版分类">
          <a-select v-model:value="formState.type" allow-clear class="select-placeholder" placeholder="全部"
            :options="contractCategoryOptions" style="width: 259px" />
        </a-form-item>
      </a-form>
      <template #right>
        <a-button class="mg-l-1 circle-4" @click="reset">重 置</a-button>
        <a-button class="mg-l-1" type="primary circle-4" @click="search">查 询</a-button>
      </template>
    </SearchCard>
    <a-card :bordered="false" class="card_table mg-t-small">
      <div class="flex justify-end mg-t-medium" v-if="PERM('模版新增')">
        <a-button type="primary" @click="goCreateTemplate">新 增</a-button>
      </div>
      <a-table class="mg-t-medium" row-key="id" :columns="columns" :data-source="dataSource" :loading="loadTable" :pagination="searchQuery"
        :scroll="{ x: 1080 }" @change="handleTableChange">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'templateName'">
            <a-button type="link" class="pd-l-small" @click="
              toRouterQuery('/basic/template/detail', { id: record.id })
              ">
              {{ record.templateName }}
            </a-button>
          </template>
          <template v-if="column.key === 'status'">
            <span :class="record.status === 1 ? 'status-on' : 'status-off'">
              <a-switch :checked="record.status == 1" @click="onEnable(record)" />
            </span>
          </template>
          <template v-if="column.key === 'oper'">
            <a-button type="link" v-if="PERM('模版编辑')" @click="onEdit(record)"> 编辑 </a-button>
            <a-button type="link" v-if="PERM('模版附件下载')" class="mg-l-small" @click="onDownload(record)">
              下载
            </a-button>
            <a-popconfirm v-if="PERM('模版删除')" class="mg-l-small" title="你确定要删除吗？" cancel-text="取消" placement="topRight"
              @confirm="onDelete(record)">
              <a-button type="link">
                删除
              </a-button>
            </a-popconfirm>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
defineOptions({ name: "BasicTemplatePage" });

import { onActivated, ref, inject } from "vue";
const PERM = inject('PERM');
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import SearchCard from "@/components/system/SearchCard.vue";
import useTable from "@/hook/useTable.js";
import { downloadPack } from "@/utils/preview.js";
import {
  getTemplateList,
  deleteTemplate,
  changeStatusTemplate,
} from "@/api/Basic/template.js";

const router = useRouter();

const contractCategoryOptions = [
  { label: "合同", value: 1 },
  { label: "资产台账", value: 2 },
];

const columns = [
  {
    title: "模板名称",
    dataIndex: "templateName",
    key: "templateName",
    width: 300,
  },
  {
    title: "模版分类",
    dataIndex: "type",
    key: "type",
    width: 200,

    customRender: ({ record }) => {
      return record.type === 1 ? "合同" : "资产台账";
    },
  },
  { title: "启用状态", dataIndex: "status", key: "status", width: 200 },
  {
    title: "创建人",
    dataIndex: "createUserName",
    key: "createUserName",
    width: 200,
  },
  {
    title: "创建时间",
    sorter: true,
    dataIndex: "createTime",
    key: "createTime",
    width: 200,
  },
  { title: "操作", key: "oper", width: 150, fixed: "right" },
];

const getApi = async (query) => {
  const { data } = await getTemplateList(query);
  return { data: data.data, total: data.total };
};

const getSearchQuery = (query) => query;

const {
  reset,
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
  },
  { getSearchQuery },
);

const goCreateTemplate = () =>
  router.push({ path: "/basic/template/edit", query: { mode: "模版新增" } });

const onEdit = (record) => {
  router.push({
    path: "/basic/template/edit",
    query: { mode: "模版修改", id: String(record.id) },
  });
};

const onDownload = (record) => {
  if (!record.file?.length) {
    message.warning("暂无附件");
    return;
  }
  downloadPack(record.file, `${record.templateName}-附件`)
};

const onDelete = async (record) => {
  const res = await deleteTemplate({ id: record.id });
  if (res.errno !== 0) return;
  message.success("已删除");

  getList('del');
};

/** changeStatusTemplate：POST /api/template/changeStatus，body { id, status }；成功 { errno: 0 } */
const onEnable = async (record) => {
  const res = await changeStatusTemplate({
    id: record.id,
    status: record.status == 1 ? 0 : 1,
  });
  if (res.errno === 0) {
    message.success(record.status == 1 ? "已停用" : "已启用");
    getList();
  }
};

onActivated(() => getList());
</script>

<style scoped></style>
