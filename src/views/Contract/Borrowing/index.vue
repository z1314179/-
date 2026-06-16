<template>
  <div class="page-content">
    <SearchCard :is-exp="false">
      <a-form
        layout="inline"
        autocomplete="off"
        :label-col="{ style: { width: '70px' } }"
      >
        <a-form-item label="借阅信息">
          <a-input
            v-model:value="formState.contractInfo"
            :maxlength="200"
            allow-clear
            placeholder="合同号/合同名称/对方客商名称"
          />
        </a-form-item>
        <a-form-item label="借阅人">
          <a-input
            v-model:value="formState.applicantUserName"
            :maxlength="200"
            allow-clear
            placeholder="请输入"
          />
        </a-form-item>
        <a-form-item label="借阅状态">
          <a-select
            v-model:value="formState.borrowStatus"
            :options="borrowStatusList.arr"
            allow-clear
            class="select-placeholder"
            placeholder="全部"
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
        <a-button
          type="primary"
          @click="handleApprove"
          v-if="PERM('合同借阅新增')"
        >
          发起借阅申请
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
        <template #bodyCell="{ record, column }">
          <template v-if="column.dataIndex === 'borrowStatus'">
            <span
              class="tag_base_dddddddd"
              :class="borrowStatusList.obj[record.borrowStatus]?.class"
            >
              {{ borrowStatusList.obj[record.borrowStatus]?.label }}
            </span>
          </template>
          <template v-if="column.dataIndex === 'cz'">
            <a-space :size="8">
              <a-button type="link" @click="handleLook(record)">查看</a-button>
              <a-button
                type="link"
                v-if="PERM('合同借阅编辑')"
                :disabled="!BTN_STATUS.EDIT.includes(record.borrowStatus)"
                @click="handleEdit(record)"
                >编辑</a-button
              >
              <a-popconfirm
                placement="top"
                ok-text="确定"
                cancel-text="取消"
                :disabled="!BTN_STATUS.DELETE.includes(record.borrowStatus)"
                v-if="PERM('合同借阅删除')"
                @confirm="handleDelete(record)"
              >
                <template #title>
                  <div>你确定要删除吗？</div>
                </template>
                <a-button
                  type="link"
                  :disabled="!BTN_STATUS.DELETE.includes(record.borrowStatus)"
                  v-if="PERM('合同借阅删除')"
                  >删除</a-button
                >
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
import { getBorrowingList, delBorrowing } from "@/api/Contract/borrowing.js";
import SearchCard from "@/components/system/SearchCard.vue";
import useTable from "@/hook/useTable.js";
import hookMap from "@/views/Contract/hookMap";

defineOptions({ name: "ContractBorrowingPage" });

// 按钮状态
const BTN_STATUS = {
  EDIT: [1, 6], // 查看 借阅状态
  DELETE: [1, 6], // 删除 借阅状态
};

const PERM = inject("PERM");
const router = useRouter();
const { borrowStatusList } = hookMap();

const handleApprove = () => {
  router.push({ path: "/contract/borrowing/add" });
};
const handleLook = (record) => {
  router.push({
    path: "/contract/borrowing/BorrowingDetails",
    query: { id: record.id },
  });
};
const handleEdit = (record) => {
  router.push({ path: "/contract/borrowing/edit", query: { id: record.id } });
};

const handleDelete = async (record) => {
  const res = await delBorrowing({ id: record.id });
  if (res.errno === 0) {
    message.success("删除成功");
    getList();
  }
};

const getApi = async (query) => {
  const { data } = await getBorrowingList(query);
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
    width: 52,
    customRender: ({ index }) => {
      return index + 1;
    },
  },
  {
    title: "借阅人",
    dataIndex: "applicantUserName",
    key: "applicantUserName",
    width: 200,
  },
  {
    title: "借阅日期",
    dataIndex: "borrowDate",
    key: "borrowDate",
    width: 200,
    sorter: true,
  },
  {
    title: "借阅起止日期",
    dataIndex: "borrowStartDate",
    key: "borrowStartDate",
    width: 300,
    sorter: true,
    customRender: ({ record }) => {
      return record.borrowStartDate + "至" + record.borrowEndDate;
    },
  },
  {
    title: "状态",
    dataIndex: "borrowStatus",
    key: "borrowStatus",
    width: 100,
  },
  {
    title: "操作",
    dataIndex: "cz",
    key: "cz",
    width: 132,
    fixed: "right",
  },
];
</script>
