<template>
  <div class="page-content">
    <SearchCard :is-exp="false">
      <a-form
        layout="inline"
        autocomplete="off"
        :label-col="{ style: { width: '70px' } }"
      >
        <a-form-item label="移交人">
          <a-input
            v-model:value="formState.transferUserName"
            :maxlength="200"
            allow-clear
            placeholder="请输入"
          />
        </a-form-item>
        <a-form-item label="被移交人">
          <a-input
            v-model:value="formState.acceptUserName"
            :maxlength="200"
            allow-clear
            placeholder="请输入"
          />
        </a-form-item>
      </a-form>
      <template #right>
        <a-button class="mg-l-1" @click="reset">重 置</a-button>
        <a-button class="mg-l-1" type="primary" @click="search">查 询</a-button>
      </template>
    </SearchCard>
    <a-card :bordered="false" class="card_table mg-t-small">
      <div class="flex justify-end mg-y-medium">
        <a-button type="primary" @click="handleAdd" v-if="PERM('数据移交新增')">
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
        :scroll="{ x: 1200 }"
      >
        <template #bodyCell="{ record, column }">
          <template v-if="column.dataIndex === 'cz'">
            <a-space :size="8">
              <a-button type="link" @click="handleLook(record)">查看</a-button>

              <a-button
                type="link"
                :disabled="!handleDisabled(record)"
                @click="handleEdit(record)"
                v-if="PERM('数据移交编辑')"
              >
                编辑
              </a-button>
              <a-popconfirm
                placement="top"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDelete(record)"
                :disabled="!handleDisabled(record)"
                v-if="PERM('数据移交删除')"
              >
                <template #title>
                  <div>你确定要删除吗？</div>
                </template>
                <a-button
                  type="link"
                  :disabled="!handleDisabled(record)"
                  v-if="PERM('数据移交删除')"
                >
                  删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
  <DataMgmtModal v-model:open="openState" :openId="openId" @change="getList" />
  <DataMgmtDetailsModal v-model:open="openStateDetails" :openId="openId" />
</template>
<script setup>
import { onActivated, ref, inject } from "vue";
import { message } from "ant-design-vue";
import { useRouter } from "vue-router";
import { getDataMgmtList, delDataMgmt } from "@/api/Settings/dataMgmt.js";
import SearchCard from "@/components/system/SearchCard.vue";
import DataMgmtModal from "./modals/DataMgmtModal.vue";
import DataMgmtDetailsModal from "./modals/DataMgmtDetailsModal.vue";
import useTable from "@/hook/useTable.js";

defineOptions({ name: "SettingsDataMgmtPage" });

const PERM = inject("PERM");

const router = useRouter();
const openState = ref(false);
const openStateDetails = ref(false);
const openId = ref(null);

const handleDisabled = (record) => {
  return new Date(record.effectDate).getTime() > new Date().getTime();
};

const handleAdd = () => {
  openId.value = null;
  openState.value = true;
};
const handleLook = (record) => {
  openId.value = record.id;
  openStateDetails.value = true;
};
const handleEdit = (record) => {
  openId.value = record.id;
  openState.value = true;
};

const handleDelete = async (record) => {
  const res = await delDataMgmt({ id: record.id });
  if (res.errno === 0) {
    message.success("删除成功");
    getList();
  }
};
const getApi = async (query) => {
  const { data } = await getDataMgmtList(query);
  const total = data.length;
  return { data: data.data, total };
};

const getSearchQuery = (query) => {
  let sort = {
    effectDate: "effect_date",
    createTime: "create_time",
  };
  if (query.sort) {
    query.orderBy = sort[query.sort];
    query.sort = query.order;
    delete query.order;
  }
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
    width: 52,
    customRender: ({ index }) => {
      return index + 1;
    },
  },
  {
    title: "移交人",
    dataIndex: "transferUserName",
    key: "transferUserName",
    width: 200,
  },
  {
    title: "被移交人",
    dataIndex: "acceptUserName",
    key: "acceptUserName",
    width: 200,
  },
  {
    title: "生效日期",
    dataIndex: "effectDate",
    key: "effectDate",
    width: 200,
    sorter: true,
  },
  {
    title: "创建时间",
    dataIndex: "createTime",
    key: "createTime",
    width: 200,
    sorter: true,
  },
  {
    title: "创建人",
    dataIndex: "createUserName",
    key: "createUserName",
    width: 200,
  },
  { title: "操作", dataIndex: "cz", key: "cz", width: 272, fixed: "right" },
];
</script>
