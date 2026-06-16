<template>
  <div class="page-content">
    <SearchCard :is-exp="false">
      <a-form
        layout="inline"
        autocomplete="off"
        :label-col="{ style: { width: '70px' } }"
      >
        <a-form-item label="预警名称">
          <a-input
            v-model:value="formState.name"
            :maxlength="200"
            allow-clear
            placeholder="请输入"
          />
        </a-form-item>
        <a-form-item label="预警类型">
          <a-select
            v-model:value="formState.type"
            :options="alertTypeList.arr"
            allow-clear
            class="select-placeholder"
            placeholder="全部"
          >
          </a-select>
        </a-form-item>
      </a-form>
      <template #right>
        <a-button class="mg-l-1" @click="reset">重 置</a-button>
        <a-button class="mg-l-1" type="primary" @click="search">查 询</a-button>
      </template>
    </SearchCard>
    <a-card :bordered="false" class="card_table mg-t-small">
      <div class="flex justify-end mg-y-medium">
        <a-button type="primary" @click="handleAdd" v-if="PERM('预警新增')">
          新增
        </a-button>
      </div>
      <a-table
        row-key="id"
        :columns="columns"
        :data-source="dataSource"
        :loading="loadTable"
        :pagination="searchQuery"
        @change="handleTableChange"
        :scroll="{ x: 1000 }"
      >
        <template #bodyCell="{ record, column }">
          <template v-if="column.key === 'status'">
            <span :class="record.status === 1 ? 'status-on' : 'status-off'">
              <a-switch
                :checked="record.status == 1"
                @click="handleStatus(record)"
                :disabled="
                  !(
                    (PERM('预警生效') && record.status == 2) ||
                    (PERM('预警失效') && record.status == 1)
                  )
                "
              />
            </span>
          </template>
          <template v-if="column.dataIndex === 'cz'">
            <a-space :size="8">
              <a-button type="link" @click="handleLook(record)">详情</a-button>
              <a-button
                type="link"
                @click="handleEdit(record)"
                v-if="PERM('预警编辑')"
                >编辑</a-button
              >
              <a-popconfirm
                placement="top"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDelete(record)"
                v-if="PERM('预警删除')"
              >
                <template #title>
                  <div>你确定要删除吗？</div>
                </template>
                <a-button type="link" v-if="PERM('预警删除')">删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
  <AlertModal
    v-model:open="openState"
    :detailsInfo="detailsInfo"
    @change="getList"
  ></AlertModal>
  <AlertDetailsModal
    v-model:open="openStateDetails"
    :detailsInfo="detailsInfo"
  ></AlertDetailsModal>
</template>
<script setup>
import { onActivated, ref, inject } from "vue";
import { message } from "ant-design-vue";
import { useRouter } from "vue-router";
import {
  getAlertList,
  deleteAlert,
  updateStatus,
} from "@/api/Settings/alert.js";
import SearchCard from "@/components/system/SearchCard.vue";
import AlertModal from "./modals/AlertModal.vue";
import AlertDetailsModal from "./modals/AlertDetailsModal.vue";
import useTable from "@/hook/useTable.js";
import hookMap from "@/views/Settings/hookMap";

defineOptions({ name: "SettingsAlertPage" });

const PERM = inject("PERM");

const { alertTypeList } = hookMap();
const router = useRouter();
const openState = ref(false);
const openStateDetails = ref(false);
const detailsInfo = ref({});

const handleAdd = () => {
  detailsInfo.value = {};
  openState.value = true;
};
const handleLook = (record) => {
  detailsInfo.value = { ...record };
  openStateDetails.value = true;
};
const handleEdit = (record) => {
  detailsInfo.value = { ...record };
  openState.value = true;
};

const handleDelete = async (record) => {
  const res = await deleteAlert(record.id);
  if (res.errno === 0) {
    message.success("删除成功");
    getList();
  }
};

const handleStatus = async (record) => {
  const res = await updateStatus(record.id);
  if (res.errno === 0) {
    message.success("设置成功");
    record.status = record.status === 1 ? 2 : 1;
  }
};

const getApi = async (query) => {
  const { data } = await getAlertList(query);
  const total = data.total;
  return { data: data.data, total };
};

const getSearchQuery = (query) => {
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
  { title: "预警名称", dataIndex: "name", key: "name", width: 350 },
  {
    title: "预警类型",
    dataIndex: "type",
    key: "type",
    width: 200,
    customRender: ({ record }) => {
      return alertTypeList.obj[record.type].label;
    },
  },
  {
    title: "生效状态",
    dataIndex: "status",
    key: "status",
    width: 200,
  },
  {
    title: "操作",
    dataIndex: "cz",
    key: "cz",
    width: 200,
    fixed: "right",
  },
];
</script>
