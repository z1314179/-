<template>
  <div class="table-field">
    <a-table :columns="tableColumns" :data-source="tableRows" :pagination="false" size="small" :bordered="tableRows.length > 0"
      row-key="__rowKey">
      <template #bodyCell="{ column, record, index }">
        <template v-if="!isDetail">
          <template v-if="column.key === '__actions'">
            <a-button type="link" danger @click="removeTableRow(index)">删除</a-button>
          </template>
          <a-form-item v-else :name="[...fieldFormName, tableFieldKey, index, column.dataIndex]"
            :rules="cellFieldRules(column.childItem)" no-style>
            <DingFieldControlCore :item="column.childItem" :form-data="record" :field-key="column.dataIndex"
              compact-textarea @upload-done="onCellUploadDone" />
          </a-form-item>
        </template>
        <template v-else>
          <DingFieldControlCore :isDetail="isDetail" :item="column.childItem" :form-data="record"
            :field-key="column.dataIndex" />
        </template>
      </template>
    </a-table>
    <a-button class="mg-t-small" type="dashed" block v-if="!isDetail" @click="addTableRow">
      {{ item.actionName || "添加" }}
    </a-button>
  </div>
</template>

<script setup>
import DingFieldControlCore from "./DingFieldControlCore.vue";
import { computed, onMounted } from "vue";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  formData: {
    type: Object,
    required: true,
  },
  isDetail: {
    type: Boolean,
    default: false,
  },
  fieldFormName: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["upload-done"]);

const resolveChildColumnKey = (child) => child.props?.id ?? child.id ?? "";

let tableRowSeed = 0;

const tableFieldKey = computed(
  () => props.item.props?.id ?? props.item.id ?? "",
);

const tableRows = computed(() => {
  const raw = props.formData[tableFieldKey.value];
  return Array.isArray(raw) ? raw : [];
});

const tableColumns = computed(() => {
  const children = Array.isArray(props.item.children)
    ? props.item.children
    : [];
  const fieldColumns = children.map((child) => {
    const colKey = resolveChildColumnKey(child);
    return {
      title: child.label ?? child.props?.label ?? "",
      dataIndex: colKey,
      key: colKey,
      childItem: child,
      width: 180,
    };
  });
  if (props.isDetail) return fieldColumns;
  return [...fieldColumns, { title: "操作", key: "__actions", width: 80 }];
});

const cellFieldRules = (child) => {
  if (!child) return [];
  const required = Boolean(child.required ?? child.props?.required);
  if (!required) return [];
  const label = child.label ?? child.props?.label ?? "此项";
  return [
    { required: true, message: `请填写${label}`, trigger: ["change", "blur"] },
  ];
};

const onCellUploadDone = () => {
  emit("upload-done", tableFieldKey.value);
};

const createTableRow = () => {
  const row = {
    __rowKey: `${tableFieldKey.value}_${Date.now()}_${tableRowSeed++}`,
  };
  const children = Array.isArray(props.item.children)
    ? props.item.children
    : [];
  children.forEach((child) => {
    row[resolveChildColumnKey(child)] = undefined;
  });
  return row;
};

const ensureTableData = () => {
  const key = tableFieldKey.value;
  if (!key) return;
  if (!Array.isArray(props.formData[key])) {
    props.formData[key] = [];
  }
};

const addTableRow = () => {
  ensureTableData();
  const key = tableFieldKey.value;
  if (!key) return;
  props.formData[key].push(createTableRow());
};

const removeTableRow = (index) => {
  const key = tableFieldKey.value;
  if (!key || !Array.isArray(props.formData[key])) return;
  props.formData[key].splice(index, 1);
};

onMounted(() => {
  ensureTableData();
});
</script>

<style scoped lang="scss">
.table-field {
  width: 100%;
}
</style>
