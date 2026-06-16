<template>
  <div class="page-content">
    <SearchCard :is-exp="false">
      <a-form
        layout="inline"
        autocomplete="off"
        :label-col="{ style: { width: '70px' } }"
      >
        <a-form-item label="资产名称">
          <a-input
            v-model:value="formState.assetName"
            :maxlength="200"
            allow-clear
            placeholder="请输入"
          />
        </a-form-item>
        <a-form-item label="资产类型">
          <a-select
            v-model:value="formState.assetType"
            :options="assetTypeList.arr"
            :filter-option="
              (input, option) =>
                option.companyName.toLowerCase().indexOf(input.toLowerCase()) >=
                0
            "
            show-search
            allow-clear
            placeholder="全部"
            class="select-placeholder"
          />
        </a-form-item>
        <a-form-item label="状态">
          <a-select
            v-model:value="formState.status"
            :options="assetStatusList.arr"
            allow-clear
            placeholder="全部"
            class="select-placeholder"
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
        <a-button type="primary" @click="handleAdd" v-if="PERM('数字资产新增')">
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
          <template v-if="column.dataIndex === 'status'">
            <span
              class="point"
              :class="record.status === 1 ? 'point-yx' : 'point-sx'"
              >{{ assetStatusList.obj[record.status].label }}</span
            >
          </template>
          <template v-if="column.dataIndex === 'cz'">
            <a-space :size="8">
              <a-button type="link" @click="handleLook(record)">
                查看
              </a-button>
              <a-button
                type="link"
                @click="handleEdit(record)"
                v-if="PERM('数字资产编辑')"
              >
                编辑
              </a-button>
              <a-popconfirm
                placement="top"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDelete(record)"
                v-if="PERM('数字资产删除')"
              >
                <template #title>
                  <div>你确定要删除吗？</div>
                </template>
                <a-button type="link" v-if="PERM('数字资产删除')"
                  >删除</a-button
                >
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
  <TemplateModal
    v-model:open="openState"
    :templateOptions="templateData"
    @change="handleTemplateChange"
  />
</template>

<script setup>
import { ref, onActivated, inject } from "vue";
import { message } from "ant-design-vue";
import { useRouter } from "vue-router";
import {
  getLedgerList,
  delLedger,
  updateLedgerStatus,
} from "@/api/Digital/ledger.js";
import { getTemplateList } from "@/api/Basic/template.js";
import SearchCard from "@/components/system/SearchCard.vue";
import TemplateModal from "./modals/TemplateModal.vue";
import useTable from "@/hook/useTable.js";
import hookMap from "@/views/Digital/hookMap";

defineOptions({ name: "DigitalLedgerPage" });

const PERM = inject("PERM");

const { assetTypeList, assetStatusList } = hookMap();

const router = useRouter();
const openState = ref(false);
const templateData = ref([]);

const handleTemplateChange = (value) => {
  router.push({
    path: "/digital/ledger/add",
    query: value ? { templateId: value } : {},
  });
};

const handleAdd = () => {
  openState.value = true;
};
const handleEdit = (record) => {
  router.push({ path: "/digital/ledger/edit", query: { id: record.id } });
};

const handleLook = (record) => {
  router.push({
    path: "/digital/ledger/LedgerDetails",
    query: { id: record.id },
  });
};

const handleDelete = async (record) => {
  const res = await delLedger({ id: record.id });
  if (res.errno === 0) {
    message.success("删除成功");
    getList();
  }
};

const getTemplateData = async () => {
  const { data } = await getTemplateList({ type: 2, isAll: 1, status: 1 });
  templateData.value = data || [];
};

const getApi = async (query) => {
  const { data } = await getLedgerList(query);
  return { data: data.data, total: data.total };
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

onActivated(() => {
  getTemplateData();
  getList();
});

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
  { title: "资产名称", dataIndex: "assetName", key: "assetName", width: 300 },
  {
    title: "资产类型",
    dataIndex: "assetType",
    key: "assetType",
    width: 200,
    customRender: ({ record }) => assetTypeList.obj[record.assetType].label,
  },
  { title: "资产编码", dataIndex: "assetCode", key: "assetCode", width: 200 },
  {
    title: "所属部门",
    dataIndex: "organization",
    key: "organization",
    width: 100,

    customRender: ({ record }) => record.organization?.name,
  },
  {
    title: "负责人",
    dataIndex: "responseName",
    key: "responseName",
    width: 100,
  },
  {
    title: "状态",
    dataIndex: "status",
    key: "status",
    width: 100,
    // customRender: ({ record }) => assetStatusList.obj[record.status].label,
  },
  { title: "操作", dataIndex: "cz", key: "cz", width: 200, fixed: "right" },
];
</script>
<style lang="scss" scoped>
.point {
  &::before {
    content: "";
    width: 8px;
    height: 8px;
    display: inline-block;
    background: rgba(0, 0, 0, 0.85);
    border-radius: 50%;
    margin-right: 7px;
  }
  &.point-sx {
    &::before {
      background: #e5484d;
    }
  }
  &.point-yx {
    &::before {
      background: #52c41a;
    }
  }
}
</style>
