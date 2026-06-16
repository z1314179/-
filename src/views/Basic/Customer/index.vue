<template>
  <div class="page-content pd-t-small">
    <SearchCard :is-exp="false">
      <a-form
        layout="inline"
        autocomplete="off"
        :label-col="{ style: { width: '70px' } }"
      >
        <a-form-item label="客商名称">
          <a-input
            v-model:value="formState.name"
            :maxlength="200"
            allow-clear
            placeholder="请输入"
          />
        </a-form-item>
        <a-form-item label="合作进度">
          <a-select
            v-model:value="formState.cooperateStatus"
            :options="cooperationProgressList.arr"
            allow-clear
            placeholder="全部"
            class="select-placeholder"
          />
        </a-form-item>
        <a-form-item label="客商类型">
          <a-select
            v-model:value="formState.type"
            :options="guestTypeList.arr"
            allow-clear
            placeholder="全部"
            class="select-placeholder"
          />
        </a-form-item>
        <a-form-item label="客商分类">
          <a-select
            v-model:value="formState.custType"
            :options="guestClassifyList.arr"
            allow-clear
            placeholder="全部"
            class="select-placeholder"
          />
        </a-form-item>
        <a-form-item label="达人机构">
          <a-input
            v-model:value="formState.platform"
            :maxlength="200"
            allow-clear
            placeholder="请输入"
          />
        </a-form-item>
        <a-form-item label="引入渠道">
          <a-select
            v-model:value="formState.channel"
            :options="importChannelList.arr"
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
        <a-button type="primary" @click="handleAdd" v-if="PERM('客商新增')">
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
        :scroll="{ x: 1112 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'customerName'">
            <a-tooltip :title="record.customerName">
              <span>
                <template
                  v-if="
                    record.customerName && record.customerName.includes('_')
                  "
                >
                  <span>{{ record.customerName.split("_")[0] }}</span>
                  <span style="color: rgba(0, 0, 0, 0.45)"
                    >_{{
                      record.customerName.split("_").slice(1).join("_")
                    }}</span
                  >
                </template>
                <template v-else>
                  {{ record.customerName }}
                </template>
              </span>
            </a-tooltip>
          </template>
          <template v-if="column.dataIndex === 'creditCode'">
            <a-tooltip
              :title="
                record.type === 1 ? record.creditCode : record.licenseCode
              "
            >
              <span>
                {{ record.type === 1 ? record.creditCode : record.licenseCode }}
              </span>
            </a-tooltip>
          </template>
          <template v-if="column.dataIndex === 'contactPersons'">
            <a-tooltip :title="record.contactPersons">
              <span>
                {{ record.contactPersons }}
              </span>
            </a-tooltip>
          </template>
          <template v-if="column.dataIndex === 'createUser'">
            <a-tooltip :title="record.createUser">
              <span>
                <template
                  v-if="record.createUser && record.createUser.includes('_')"
                >
                  <span>{{ record.createUser.split("_")[0] }}</span>
                  <span style="color: rgba(0, 0, 0, 0.45)"
                    >_{{
                      record.createUser.split("_").slice(1).join("_")
                    }}</span
                  >
                </template>
                <template v-else>
                  {{ record.createUser }}
                </template>
              </span>
            </a-tooltip>
          </template>
          <template v-if="column.dataIndex === 'cooperateStatus'">
            {{ cooperationProgressList.obj[record.cooperateStatus]?.label }}
          </template>
          <template v-if="column.dataIndex === 'cz'">
            <a-space :size="8">
              <a-button type="link" @click="handleLook(record)">
                查看
              </a-button>
              <a-button
                v-if="PERM('客商编辑')"
                type="link"
                @click="handleEdit(record)"
              >
                编辑
              </a-button>
              <a-popconfirm
                placement="top"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDelete(record)"
                v-if="PERM('客商删除')"
              >
                <template #title>
                  <div>你确定要删除吗？</div>
                </template>
                <a-button type="link" v-if="PERM('客商删除')">删除</a-button>
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
import { useRouter } from "vue-router";
import { getCustomerList, delCustomer } from "@/api/Basic/customer.js";
import SearchCard from "@/components/system/SearchCard.vue";
import useTable from "@/hook/useTable.js";
import hookMap from "@/views/Basic/hookMap";

defineOptions({ name: "BasicCustomerPage" });

const PERM = inject("PERM");

const router = useRouter();
const {
  cooperationProgressList,
  guestTypeList,
  guestClassifyList,
  importChannelList,
} = hookMap();
const handleAdd = () => {
  router.push({ path: "/basic/customer/add" });
};
const handleLook = (record) => {
  router.push({
    path: "/basic/customer/CustomerDetails",
    query: { id: record.id },
  });
};

const handleEdit = (record) => {
  router.push({ path: "/basic/customer/edit", query: { id: record.id } });
};
const handleDelete = async (record) => {
  const res = await delCustomer({ id: record.id });
  if (res.errno === 0) {
    message.success("删除成功");
    getList();
  }
};

const getTooltipTitle = async (record) => {
  switch (record.type) {
    case 1:
      return record.legalPerson
        ? `${record.name}_${record.legalPerson}`
        : record.name;
    case 2:
      return `${record.name}`;
    case 3:
      return record.platform
        ? `${record.name}_${record.platform}`
        : record.platform;
  }
};

const getApi = async (query) => {
  const { data } = await getCustomerList(query);
  for (let i = 0; i < data.data.length; i++) {
    const item = data.data[i];
    data.data[i].customerName = await getTooltipTitle(item);
    data.data[i].createUser =
      `${item.createUserName}_${item.createUserOrganization?.organization?.name}`;
    data.data[i].contactPersons = item.supplierPersons
      ?.map((item) => item.name)
      .join("、");
  }
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
    title: "客商名称",
    dataIndex: "customerName",
    key: "customerName",
    width: 300,
    ellipsis: true,
  },
  {
    title: "证件号码",
    dataIndex: "creditCode",
    key: "creditCode",
    width: 180,
    ellipsis: true,
  },
  {
    title: "客商类型",
    dataIndex: "type",
    key: "type",
    width: 100,
    customRender: ({ record }) => guestTypeList.obj[record.type]?.label,
  },
  {
    title: "客商分类",
    dataIndex: "custType",
    key: "custType",
    width: 100,
    customRender: ({ record }) => guestClassifyList.obj[record.custType]?.label,
  },
  {
    title: "联系人",
    dataIndex: "contactPersons",
    key: "contactPersons",
    width: 100,
    ellipsis: true,
  },
  {
    title: "合作进度",
    dataIndex: "cooperateStatus",
    key: "cooperateStatus",
    width: 100,
  },
  {
    title: "经办人",
    dataIndex: "createUser",
    key: "createUser",
    width: 100,
    ellipsis: true,
  },
  { title: "操作", dataIndex: "cz", key: "cz", width: 132 },
];
</script>
<style lang="less" scoped>
.progress-tag {
  border-radius: 4px;
  padding: 2px 8px;
}
</style>
