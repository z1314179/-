<template>
  <div>
    <a-dropdown
      v-model:open="strictOpen"
      :trigger="['click']"
      :disabled="!!attrs.disabled"
      :get-popup-container="attrs.getPopupContainer"
      placement="bottomLeft"
      :overlay-style="{ padding: 0 }"
      overlay-class-name="cascader-check-strict-drop"
    >
      <div
        class="cascader-strict-trigger"
        :class="[attrs.class, { 'is-disabled': !!attrs.disabled }]"
        :style="attrs.style"
        role="button"
        tabindex="0"
      >
        <div class="cascader-strict-trigger-inner">
          <template v-if="multiple && treePrimitiveValue.length">
            <span
              v-for="id in visibleTagIds"
              :key="String(id)"
              class="cascader-strict-tag"
            >
              <span class="cascader-strict-tag-text">{{ idToLabel[String(id)] ?? id }}</span>
              <span class="cascader-strict-tag-close" @click.stop="removeTag(id)">×</span>
            </span>
            <span v-if="overflowTagCount > 0" class="cascader-strict-tag-overflow"
              >+{{ overflowTagCount }}</span
            >
          </template>
          <span
            v-else-if="!multiple && singleDisplayValue !== ''"
            class="cascader-strict-single-text"
            >{{ singleDisplayValue }}</span
          >
          <span v-else class="cascader-strict-placeholder">{{
            attrs.placeholder ?? "请选择"
          }}</span>
        </div>
        <span class="cascader-strict-suffix">
          <span
            v-if="showClearIcon"
            class="cascader-strict-clear"
            @click.stop="clearAll"
            >×</span
          >
          <DownOutlined class="cascader-strict-arrow" />
        </span>
      </div>
      <template #overlay>
        <div class="cascader-strict-overlay-inner" @mousedown.prevent>
          <div v-if="showSearchBar" class="cascader-strict-search" @click.stop>
            <a-input
              v-model:value="searchKeyword"
              allow-clear
              placeholder="搜索"
              @click.stop
            />
          </div>
          <div
            v-if="showSelectAllRow"
            class="template-checkbox-all"
            @mousedown.prevent
          >
            <a-checkbox
              :checked="isAllChecked"
              class="pd-x-large"
              :disabled="!!attrs.disabled"
              @change="handleSelectAllChange"
            >
              <span class="pd-x-small">{{ selectAllText }}</span>
            </a-checkbox>
          </div>
          <div class="cascader-strict-menu-root">
            <div
              v-for="(col, colIdx) in strictColumns"
              :key="colIdx"
              class="cascader-strict-column"
            >
              <div
                v-for="node in col"
                :key="String(node[VAL])"
                class="cascader-strict-menu-item"
                :class="{
                  'cascader-strict-menu-item-active': isRowActive(node, colIdx),
                  'cascader-strict-menu-item-selected': isRowSelected(node),
                }"
                @click="onRowLabelClick(node, colIdx)"
              >
                <span
                  v-if="multiple"
                  class="cascader-strict-menu-item-checkbox"
                  @click.stop
                >
                  <a-checkbox
                    :checked="isNodeChecked(node)"
                    :disabled="node.disabled"
                    @change="(e) => onCheckboxChange(node, e)"
                  />
                </span>
                <span class="cascader-strict-menu-item-label">{{ node[fieldLabelKey] }}</span>
                <RightOutlined
                  v-if="node[CH] && node[CH].length"
                  class="cascader-strict-menu-item-arrow"
                />
              </div>
            </div>
          </div>
        </div>
      </template>
    </a-dropdown>
  </div>
</template>

<script setup>
import { defineProps, computed, ref, watch, useAttrs, nextTick } from "vue";
import { DownOutlined, RightOutlined } from "@ant-design/icons-vue";

defineOptions({
  name: "",
});
const attrs = useAttrs();
const props = defineProps({
  options: {
    type: Array,
    default: () => [],
  },
  value: {
    type: [String, Number, Array],
    default: "",
  },
  fieldNames: {
    type: Object,
    default: {
      label: "label",
      value: "value",
      children: "children",
    },
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  /** 多选时父子勾选互不关联 */
  checkStrictly: {
    type: Boolean,
    default: false,
  },
  /** 多选时是否在面板顶部展示「全选」行（与 Template/Edit 部门树下拉一致） */
  showSelectAll: {
    type: Boolean,
    default: true,
  },
  /** 「全选」文案 */
  selectAllText: {
    type: String,
    default: "全部",
  },
});
const emit = defineEmits(["update:value", "changeCascaderRadio"]);

const fieldLabelKey = computed(() => props.fieldNames.label ?? "label");

let VAL = props.fieldNames["value"];
let CH = props.fieldNames["children"];
const getAllDept = (arr, t = {}, zIds = []) => {
  let ids = [];
  return arr.reduce((obj, e) => {
    e[VAL] += "";
    ids = [...zIds, e[VAL]];
    e.guideId = ids;
    if (e[CH]) {
      obj[e[VAL]] = e.guideId.join(",");
      getAllDept(e[CH], obj, ids);
    } else {
      obj[e[VAL]] = e.guideId.join(",");
    }
    return obj;
  }, t);
};
const optionsList = computed(() => {
  let arr = JSON.parse(JSON.stringify(props.options));
  let obj = getAllDept(arr);
  return { arr, obj };
});

const idToLabel = computed(() => {
  const map = {};
  const walk = (nodes) => {
    if (!nodes?.length) return;
    for (const n of nodes) {
      map[String(n[VAL])] = n[fieldLabelKey.value];
      walk(n[CH]);
    }
  };
  walk(optionsList.value.arr);
  return map;
});

const treePrimitiveValue = computed(() => {
  if (!props.multiple) return [];
  const v = props.value;
  if (!v) return [];
  return Array.isArray(v) ? v : [];
});

const singleDisplayValue = computed(() => {
  if (props.multiple) return "";
  const v = props.value;
  if (v === undefined || v === null || v === "") return "";
  return idToLabel.value[String(v)] ?? String(v);
});

const maxTagCount = computed(() => {
  const m = attrs["max-tag-count"] ?? attrs.maxTagCount;
  if (m === "responsive") return 2;
  const n = Number(m);
  return Number.isFinite(n) && n > 0 ? n : 9999;
});

const visibleTagIds = computed(() => {
  const list = treePrimitiveValue.value;
  const max = maxTagCount.value;
  if (list.length <= max) return list;
  return list.slice(0, max);
});

const overflowTagCount = computed(() => {
  const list = treePrimitiveValue.value;
  const max = maxTagCount.value;
  return list.length > max ? list.length - max : 0;
});

const showClearIcon = computed(() => {
  if (!attrs.allowClear || attrs.disabled) return false;
  if (props.multiple) return treePrimitiveValue.value.length > 0;
  const v = props.value;
  return v !== undefined && v !== null && v !== "";
});

const showSearchBar = computed(() => {
  return !!(attrs.showSearch || attrs["show-search"]);
});

const showSelectAllRow = computed(
  () => props.multiple && props.showSelectAll
);

/** 树中可选节点 id（与 Edit.vue collectAllDeptIds 一致：含各级，排除 disabled） */
const allSelectableIdsFlat = computed(() => {
  const ids = [];
  const walk = (nodes) => {
    if (!nodes?.length) return;
    for (const n of nodes) {
      if (!n.disabled) ids.push(String(n[VAL]));
      walk(n[CH]);
    }
  };
  walk(optionsList.value.arr);
  return ids;
});

const isAllChecked = computed(() => {
  const all = allSelectableIdsFlat.value;
  const cur = treePrimitiveValue.value.map(String);
  if (!all.length || cur.length !== all.length) return false;
  const s = new Set(cur);
  return all.every((id) => s.has(id));
});

const searchKeyword = ref("");

const strictOpen = ref(false);
const activePrefix = ref([]);

watch(
  () => optionsList.value.arr,
  () => {
    activePrefix.value = [];
  },
  { deep: true }
);

watch(searchKeyword, () => {
  if (showSearchBar.value) activePrefix.value = [];
});

function pathPrefixNodesFromValue() {
  const roots = optionsList.value.arr || [];
  const v = props.value;
  if (props.multiple || v === undefined || v === null || v === "") return null;
  const pathStr = optionsList.value.obj[String(v)];
  if (!pathStr) return null;
  const ids = pathStr.split(",");
  const prefix = [];
  let list = roots;
  for (let i = 0; i < ids.length - 1; i++) {
    const node = list.find((n) => String(n[VAL]) === ids[i]);
    if (!node) break;
    prefix.push(node);
    list = node[CH] || [];
  }
  return prefix.length ? prefix : null;
}

function defaultExpandFirstSecondLevel() {
  const roots = optionsList.value.arr || [];
  const first = roots.find((r) => r[CH] && r[CH].length);
  activePrefix.value = first ? [first] : [];
}

watch(strictOpen, (open) => {
  if (!open) {
    searchKeyword.value = "";
    return;
  }
  nextTick(() => {
    const restored = pathPrefixNodesFromValue();
    if (restored) activePrefix.value = restored;
    else defaultExpandFirstSecondLevel();
  });
});

const filteredRoots = computed(() => {
  const roots = optionsList.value.arr || [];
  if (!showSearchBar.value) return roots;
  const kw = searchKeyword.value.trim();
  if (!kw) return roots;
  return roots.filter((n) =>
    String(n[fieldLabelKey.value] ?? "").includes(kw)
  );
});

const strictColumns = computed(() => {
  const cols = [];
  const roots = filteredRoots.value || [];
  cols.push(roots);
  const prefix = activePrefix.value;
  for (let i = 0; i < prefix.length; i++) {
    const n = prefix[i];
    const ch = n[CH];
    if (ch && ch.length) cols.push(ch);
    else break;
  }
  return cols;
});

function isChangeOnSelect() {
  return (
    attrs.changeOnSelect === true ||
    attrs.changeOnSelect === "" ||
    attrs["change-on-select"] === true ||
    attrs["change-on-select"] === ""
  );
}

function isNodeChecked(node) {
  const id = String(node[VAL]);
  return treePrimitiveValue.value.some((v) => String(v) === id);
}

function isRowActive(node, colIdx) {
  return activePrefix.value[colIdx] === node;
}

function isRowSelected(node) {
  if (props.multiple) return false;
  return String(props.value) === String(node[VAL]);
}

function onRowLabelClick(node, colIdx) {
  if (props.multiple) {
    activePrefix.value = activePrefix.value.slice(0, colIdx);
    activePrefix.value[colIdx] = node;
    activePrefix.value = activePrefix.value.slice(0, colIdx + 1);
    return;
  }
  const hasChildren = node[CH] && node[CH].length;
  if (hasChildren) {
    activePrefix.value = activePrefix.value.slice(0, colIdx);
    activePrefix.value[colIdx] = node;
    activePrefix.value = activePrefix.value.slice(0, colIdx + 1);
  }
  const cos = isChangeOnSelect();
  if (cos || !hasChildren) {
    emit("update:value", node[VAL]);
    emit("changeCascaderRadio", node[VAL], { mode: "strict-cascader", node });
    if (!hasChildren || !cos) strictOpen.value = false;
  }
}

function emitIds(next) {
  emit("update:value", next);
  emit("changeCascaderRadio", next, { mode: "strict-cascader" });
}

/** 与 Edit.vue handleDeptDropdownAllCheckboxChange 相同逻辑 */
function handleSelectAllChange(e) {
  if (e?.target?.checked) {
    emitIds([...allSelectableIdsFlat.value]);
  } else {
    emitIds([]);
  }
}

function onCheckboxChange(node, e) {
  const checked = e?.target?.checked;
  const id = String(node[VAL]);
  const cur = treePrimitiveValue.value.map(String);
  const idx = cur.indexOf(id);
  let next;
  if (checked && idx === -1) next = [...cur, id];
  else if (!checked && idx !== -1) {
    next = cur.filter((_, i) => i !== idx);
  } else {
    return;
  }
  emitIds(next);
}

function removeTag(id) {
  const next = treePrimitiveValue.value.filter((x) => String(x) !== String(id));
  emitIds(next);
}

function clearAll() {
  if (props.multiple) emitIds([]);
  else {
    emit("update:value", undefined);
    emit("changeCascaderRadio", undefined, null);
  }
}
</script>

<style lang="scss" scoped>
.cascader-strict-trigger {
  display: flex;
  align-items: flex-start;
  min-height: 32px;
  padding: 1px 28px 1px 4px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  position: relative;
  box-sizing: border-box;
  transition: border-color 0.2s;
  &:hover {
    border-color: #4096ff;
  }
  &.is-disabled {
    cursor: not-allowed;
    background: rgba(0, 0, 0, 0.04);
    &:hover {
      border-color: #d9d9d9;
    }
  }
}
.cascader-strict-trigger-inner {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  min-height: 28px;
  padding: 2px 4px;
}
.cascader-strict-placeholder {
  color: rgba(0, 0, 0, 0.25);
  line-height: 24px;
  padding-left: 4px;
}
.cascader-strict-single-text {
  line-height: 24px;
  padding-left: 4px;
  color: rgba(0, 0, 0, 0.88);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cascader-strict-tag {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  margin: 2px 2px 2px 0;
  padding: 0 4px 0 8px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 4px;
  font-size: 12px;
  line-height: 22px;
}
.cascader-strict-tag-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 12em;
}
.cascader-strict-tag-close {
  margin-left: 4px;
  padding: 0 2px;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
  line-height: 1;
  &:hover {
    color: rgba(0, 0, 0, 0.88);
  }
}
.cascader-strict-tag-overflow {
  display: inline-block;
  margin: 2px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}
.cascader-strict-suffix {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: rgba(0, 0, 0, 0.25);
}
.cascader-strict-clear {
  font-size: 12px;
  cursor: pointer;
  padding: 0 2px;
  &:hover {
    color: rgba(0, 0, 0, 0.45);
  }
}
.cascader-strict-arrow {
  font-size: 12px;
}

.cascader-strict-overlay-inner {
  background: #fff;
  border-radius: 8px;
  box-shadow:
    0 6px 16px 0 rgba(0, 0, 0, 0.08),
    0 3px 6px -4px rgba(0, 0, 0, 0.12),
    0 9px 28px 8px rgba(0, 0, 0, 0.05);
  max-width: fit-content;
  overflow: hidden;
}
.cascader-strict-search {
  padding: 8px;
  border-bottom: 1px solid rgba(5, 5, 5, 0.06);
}
.template-checkbox-all {
  border-bottom: 1px solid rgba(5, 5, 5, 0.06);
}
.cascader-strict-menu-root {
  width: fit-content;
  display: flex;
  flex-direction: row;
  background: #fff;
}
.cascader-strict-column {
  min-width: 148px;
  max-width: 220px;
  max-height: 280px;
  overflow-y: auto;
  border-right: 1px solid rgba(5, 5, 5, 0.06);
  &:last-child {
    border-right: none;
  }
}
.cascader-strict-menu-item {
  display: flex;
  align-items: center;
  padding: 5px 12px;
  cursor: pointer;
  font-size: 14px;
  line-height: 22px;
  white-space: nowrap;
  &:hover {
    background: rgba(0, 0, 0, 0.04);
  }
}
.cascader-strict-menu-item-active {
  font-weight: 500;
  background: rgba(0, 0, 0, 0.04);
}
.cascader-strict-menu-item-selected {
  background: #e6f4ff;
}
.cascader-strict-menu-item-checkbox {
  margin-right: 8px;
  display: inline-flex;
  align-items: center;
}
.cascader-strict-menu-item-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cascader-strict-menu-item-arrow {
  margin-left: 8px;
  font-size: 10px;
  color: rgba(0, 0, 0, 0.45);
}
</style>
