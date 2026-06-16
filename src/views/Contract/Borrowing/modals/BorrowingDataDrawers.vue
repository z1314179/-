<template>
  <a-drawer
    :open="open"
    title="选择借阅数据"
    placement="right"
    width="1140px"
    destroy-on-close
    @close="onClose"
  >
    <SearchCard :is-exp="false" style="padding: 0">
      <a-form layout="inline" autocomplete="off" :label-col="{ style: { width: '98px' } }">
        <a-form-item label="合同名称" :label-col="{ style: { width: '70px' } }">
          <a-input v-model:value="formState.contractName" allow-clear placeholder="请输入" />
        </a-form-item>
        <a-form-item label="对方客商" :label-col="{ style: { width: '70px' } }">
          <a-input v-model:value="formState.counterpartyName" allow-clear placeholder="请输入" />
        </a-form-item>
        <a-form-item label="我方主体">
          <a-select
            v-model:value="formState.ourCompanyId"
            :options="subjectOptionsWithAll.arr"
            :filter-option="
              (input, option) =>
                option.companyName.toLowerCase().indexOf(input.toLowerCase()) >=
                0
            "
            :fieldNames="{ label: 'companyName', value: 'id' }"
            allow-clear
            show-search
            placeholder="全部"
            class="select-placeholder"
          />
        </a-form-item>
        <a-form-item label="品牌" :label-col="{ style: { width: '70px' } }">
          <a-select v-model:value="formState.brandName" :options="brandOptionsWithAll" :filter-option="(input, option) =>
              option.name.toLowerCase().indexOf(input.toLowerCase()) >= 0
            " :fieldNames="{ label: 'name', value: 'name' }" allow-clear show-search class="select-placeholder"
            placeholder="全部" />
        </a-form-item>
        <a-form-item label="经办人" :label-col="{ style: { width: '70px' } }">
          <a-input v-model:value="formState.handlerUserName" allow-clear placeholder="请输入" />
        </a-form-item>
        <a-form-item label="合同有效期">
          <a-range-picker
            v-model:value="formState.validityDateRange"
            value-format="YYYY-MM-DD"
            :placeholder="['开始日期', '结束日期']"
            allow-clear
          />
        </a-form-item>
        <div style="width: 100%; padding-left: 75px">
          <a-form-item label="">
            <a-button class="mg-l-1" @click="onReset">重 置</a-button>
            <a-button class="mg-l-1" type="primary" @click="search"
              >查 询</a-button
            >
          </a-form-item>
        </div>
      </a-form>
    </SearchCard>
    <div class="selected-tip">已选择 {{ selectedKeys.length }} 项数据</div>
    <div class="card_table">
      <a-table
        row-key="id"
        :columns="columns"
        :data-source="dataSource"
        :loading="loadTable"
        :pagination="searchQuery"
        :row-selection="rowSelection"
        :scroll="{ x: 1120 }"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'contractName'">
            <a-tooltip :title="record.contractName">
              <span>
                {{ record.contractName }}
              </span>
            </a-tooltip>
          </template>
          <template v-if="column.dataIndex === 'contractNo'">
            <a-tooltip :title="record.contractNo">
              <span>
                {{ record.contractNo }}
              </span>
            </a-tooltip>
          </template>
          <template v-if="column.dataIndex === 'ourCompanyRelations'">
            <a-tooltip
              :title="
                record.ourCompanyRelations
                  ?.map((item) => item.companyName)
                  .join('\n')
              "
            >
              <span>
                {{
                  record.ourCompanyRelations
                    ?.map((item) => item.companyName)
                    .join("\n")
                }}
              </span>
            </a-tooltip>
          </template>
          <template v-if="column.dataIndex === 'counterpartyRelations'">
            <a-tooltip
              :title="
                record.counterpartyRelations
                  ?.map((item) => item.counterpartyName)
                  .join('\n')
              "
            >
              <span>
                {{
                  record.counterpartyRelations
                    ?.map((item) => item.counterpartyName)
                    .join("、")
                }}
              </span>
            </a-tooltip>
          </template>
        </template>
      </a-table>
    </div>
    <template #footer>
      <a-button class="mg-r-small" @click="onClose">取消</a-button>
      <a-button type="primary" @click="onSave">保存</a-button>
    </template>
  </a-drawer>
</template>

<script setup>
import { computed, ref, watch, unref } from "vue";
import { message } from "ant-design-vue";
import SearchCard from "@/components/system/SearchCard.vue";
import useTable from "@/hook/useTable.js";
import { getContractList } from "@/api/Contract/lifecycle";
defineOptions({ name: "BorrowingDataDrawers" });

const props = defineProps({
  open: { type: Boolean, default: false },
  /** 主表已有行的合同号，用于打开时恢复勾选 */
  selectedContractNos: { type: Array, default: () => [] },
  brandOptionsWithAll: { type: Object, default: () => [] },
  subjectOptionsWithAll: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:open", "confirm"]);

const columns = [
  {
    title: "合同名称",
    dataIndex: "contractName",
    key: "contractName",
    width: 200,
    ellipsis: true,
  },
  {
    title: "合同号",
    dataIndex: "contractNo",
    key: "contractNo",
    width: 160,
    ellipsis: true,
  },
  {
    title: "合同分类",
    dataIndex: "contractCategory",
    key: "contractCategory",
    width: 120,
  },
  {
    title: "我方主体",
    dataIndex: "ourCompanyRelations",
    key: "ourCompanyRelations",
    width: 200,
    ellipsis: true,
  },
  {
    title: "品牌",
    dataIndex: "brandName",
    key: "brandName",
    width: 100,
  },
  {
    title: "对方客商",
    dataIndex: "counterpartyRelations",
    key: "counterpartyRelations",
    width: 200,
    ellipsis: true,
  },
  {
    title: "合同开始日期",
    dataIndex: "startDate",
    key: "startDate",
    width: 120,
    sorter: true,
  },
  {
    title: "合同结束日期",
    dataIndex: "endDate",
    key: "endDate",
    width: 120,
    sorter: true,
  },
  {
    title: "经办人",
    dataIndex: "handlerUserName",
    key: "handlerUserName",
    width: 100,
  },
];

const selectedKeys = ref([]);

const rowSelection = computed(() => ({
  selections: false,
  preserveSelectedRowKeys: true,
  selectedRowKeys: unref(selectedKeys.value.map((e) => e.id)),
  onChange: (selectedRowKeys, selectedRows) => {
    selectedKeys.value = selectedRows;
  },
  getCheckboxProps: (record) => ({
    disabled: false,
  }),
}));

const getApi = async (query) => {
  query.ignorePermission = 1;
  const { data } = await getContractList(query);
  return { data: data.data, total: data.total };
};
const getSearchQuery = (query) => {
  query.status = [4, 5, 6, 7, 10, 11];
  if (query.validityDateRange) {
    query.startDateStart = query.validityDateRange[0];
    query.startDateEnd = query.validityDateRange[1];
    delete query.validityDateRange;
  }
  return query;
};
const {
  formState,
  dataSource,
  searchQuery,
  handleTableChange,
  search,
  reset,
  loadTable,
  getList,
} = useTable(
  getApi,
  {
    current: 1,
    pageSize: 8,
    pageSizeOptions: ["8", "10", "20", "50"],
  },
  { getSearchQuery: getSearchQuery },
);

function onReset() {
  reset();
}
function onClose() {
  emit("update:open", false);
}
function onSave() {
  if (!selectedKeys.value.length) {
    message.warning("请选择要借阅的数据");
    return;
  }
  emit("confirm", selectedKeys.value);
  onClose();
}

watch(
  () => props.open,
  async (v) => {
    if (!v) {
      ((selectedKeys.value = []), (searchQuery.current = 1));
      return;
    }
    selectedKeys.value = [...props.selectedContractNos.filter((e) => e.id)];
    formState.value = {};
    await getList();
  },
);
</script>

<style lang="scss" scoped>
.selected-tip {
  font-weight: 400;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  margin-top: 8px;
  margin-bottom: 4px;
}
</style>
