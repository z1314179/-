<template>
  <a-select
    ref="selectRef"
    :class="attrs.class"
    :style="attrs.style"
    v-bind="restAttrs"
    :value="innerValue"
    :mode="multiple ? 'multiple' : undefined"
    :options="tagOptions"
    :open="mergedOpen"
    :show-search="rootShowSearch"
    :allow-clear="rootAllowClear"
    :filter-option="mergedTagFilter"
    @update:value="onOuterValueUpdate"
    @dropdown-visible-change="onDropdownVisibleChange"
  >
    <template #dropdownRender="{ menuNode }">
      <div class="cc-dd" @mousedown.prevent>
        <div class="cc-dd-search">
          <a-input-search
            v-model:value="panelKeyword"
            allow-clear
            placeholder="查询"
            @search="onPanelSearch"
          />
        </div>
        <div class="cc-dd-cols">
          <div
            v-for="(colNodes, colIndex) in cascadeColumns"
            :key="colIndex"
            class="cc-dd-col"
          >
            <div
              v-for="node in colNodes"
              :key="String(node[valueKey])"
              class="cc-dd-row"
              :class="{
                'is-active': String(draftPath[colIndex]) === String(node[valueKey]),
                'is-selected':
                  !multiple &&
                  innerValue !== undefined &&
                  innerValue !== null &&
                  innerValue !== '' &&
                  String(innerValue) === String(node[valueKey]),
              }"
            >
              <a-checkbox
                v-if="multiple"
                :checked="selectedIdSet.has(String(node[valueKey]))"
                @change="(e) => onNodeCheckChange(node, e)"
                @click.stop
              />
              <span class="cc-dd-row-label" @click="onRowActivate(node, colIndex)">
                {{ node[labelKey] }}
              </span>
              <RightOutlined v-if="hasChildren(node)" class="cc-dd-arrow" />
            </div>
          </div>
        </div>
      </div>
    </template>
  </a-select>
</template>

<script setup>
import { computed, ref, useAttrs, watch } from "vue";
import { RightOutlined } from "@ant-design/icons-vue";

defineOptions({
  name: "CascaderCheck",
  inheritAttrs: false,
});

const props = defineProps({
  options: {
    type: Array,
    default: () => [],
  },
  value: {
    type: [String, Number, Array],
    default: undefined,
  },
  fieldNames: {
    type: Object,
    default: () => ({
      children: "children",
      label: "name",
      value: "id",
    }),
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  /** 下拉内按该字段做整树过滤（与 tree-node-filter-prop 语义一致） */
  treeNodeFilterProp: {
    type: String,
    default: undefined,
  },
});

const emit = defineEmits(["update:value", "change", "changeCascaderRadio"]);

const attrs = useAttrs();
const selectRef = ref(null);
const panelKeyword = ref("");
const innerOpen = ref(false);

const valueKey = computed(() => props.fieldNames.value ?? "value");
const labelKey = computed(() => props.fieldNames.label ?? "label");
const childrenKey = computed(() => props.fieldNames.children ?? "children");

const filterTextKey = computed(
  () =>
    props.treeNodeFilterProp ??
    attrs["tree-node-filter-prop"] ??
    attrs.treeNodeFilterProp ??
    labelKey.value,
);

const rootShowSearch = computed(() => {
  if ("showSearch" in attrs || "show-search" in attrs) {
    return !!(attrs.showSearch || attrs["show-search"]);
  }
  return true;
});

const rootAllowClear = computed(() => {
  if ("allowClear" in attrs || "allow-clear" in attrs) {
    return !!(attrs.allowClear || attrs["allow-clear"]);
  }
  return true;
});

const isOpenControlled = computed(
  () => "open" in attrs && attrs.open !== undefined && attrs.open !== null,
);

const mergedOpen = computed(() => {
  if (isOpenControlled.value) return attrs.open;
  return innerOpen.value;
});

const restAttrs = computed(() => {
  const a = { ...attrs };
  const drop = [
    "class",
    "style",
    "value",
    "mode",
    "options",
    "open",
    "showSearch",
    "show-search",
    "allowClear",
    "allow-clear",
    "filterOption",
    "filter-option",
    "onUpdate:value",
    "onUpdate:Value",
    "dropdownRender",
    "dropdown-render",
    "onDropdownVisibleChange",
    "onDropdown-visible-change",
  ];
  for (const k of drop) delete a[k];
  return a;
});

function normalizeList(v) {
  if (v == null) return [];
  const arr = Array.isArray(v) ? v : [v];
  return arr.map((item) =>
    item != null && typeof item === "object" && "value" in item
      ? item.value
      : item,
  );
}

const innerValue = computed(() => {
  if (props.multiple) {
    return normalizeList(props.value);
  }
  const v = props.value;
  if (v === undefined || v === null || v === "") return undefined;
  return v;
});

const selectedIdSet = computed(() => {
  if (!props.multiple) return new Set();
  return new Set(normalizeList(props.value).map(String));
});

function findLabel(nodes, id) {
  if (id === undefined || id === null || id === "") return undefined;
  const vk = valueKey.value;
  const lk = labelKey.value;
  const ck = childrenKey.value;
  if (!nodes?.length) return undefined;
  for (const n of nodes) {
    if (String(n[vk]) === String(id)) return n[lk];
    const t = findLabel(n[ck], id);
    if (t !== undefined) return t;
  }
  return undefined;
}

const tagOptions = computed(() => {
  if (props.multiple) {
    const ids = normalizeList(props.value);
    return ids.map((id) => ({
      value: id,
      label: findLabel(props.options, id) ?? String(id),
    }));
  }
  const v = props.value;
  if (v === undefined || v === null || v === "") return [];
  return [
    {
      value: v,
      label: findLabel(props.options, v) ?? String(v),
    },
  ];
});

function defaultTagFilter(input, option) {
  const q = (input ?? "").toString().toLowerCase();
  const lab = String(option?.label ?? "").toLowerCase();
  return lab.includes(q);
}

const mergedTagFilter = computed(() => {
  if (typeof attrs.filterOption === "function") return attrs.filterOption;
  if (typeof attrs["filter-option"] === "function") return attrs["filter-option"];
  return defaultTagFilter;
});

function filterTree(nodes, kw, textKey, ck) {
  const needle = (kw ?? "").trim().toLowerCase();
  if (!needle) return nodes || [];
  const walk = (list) => {
    const out = [];
    for (const node of list) {
      const rawCh = node[ck];
      const chList = Array.isArray(rawCh) ? rawCh : [];
      const sub = chList.length ? walk(chList) : [];
      const text = String(node[textKey] ?? "").toLowerCase();
      const hit = text.includes(needle);
      if (hit || sub.length) {
        const clone = { ...node };
        if (sub.length) clone[ck] = sub;
        else if (hit && chList.length) clone[ck] = chList;
        else delete clone[ck];
        out.push(clone);
      }
    }
    return out;
  };
  return walk(nodes || []);
}

const filteredRoots = computed(() =>
  filterTree(
    props.options || [],
    panelKeyword.value,
    filterTextKey.value,
    childrenKey.value,
  ),
);

const draftPath = ref([]);

const cascadeColumns = computed(() => {
  const vk = valueKey.value;
  const ck = childrenKey.value;
  const cols = [filteredRoots.value];
  const path = draftPath.value;
  for (let i = 0; i < path.length; i++) {
    const pid = path[i];
    const cur = cols[cols.length - 1];
    const node = (cur || []).find((n) => String(n[vk]) === String(pid));
    if (!node) break;
    const ch = node[ck];
    if (ch && ch.length) cols.push(ch);
    else break;
  }
  return cols;
});

function findPathChain(nodes, targetId, vk, ck) {
  if (!nodes?.length) return null;
  for (const n of nodes) {
    if (String(n[vk]) === String(targetId)) return [n];
    const ch = n[ck];
    const sub = findPathChain(ch, targetId, vk, ck);
    if (sub) return [n, ...sub];
  }
  return null;
}

function hasChildren(node) {
  const ch = node[childrenKey.value];
  return !!(ch && ch.length);
}

function emitAll(next) {
  emit("update:value", next);
  emit("change", next);
  emit("changeCascaderRadio", next, { strict: true });
}

function onOuterValueUpdate(v) {
  if (props.multiple) {
    emitAll(normalizeList(v));
  } else {
    emitAll(v);
  }
}

function closeInner() {
  if (!isOpenControlled.value) innerOpen.value = false;
  draftPath.value = [];
}

function syncDraftFromSingleValue() {
  const vk = valueKey.value;
  const ck = childrenKey.value;
  if (props.multiple) {
    draftPath.value = [];
    return;
  }
  const v = props.value;
  if (v === undefined || v === null || v === "") {
    draftPath.value = [];
    return;
  }
  const chain = findPathChain(props.options || [], v, vk, ck);
  if (chain && chain.length) {
    draftPath.value = chain.slice(0, -1).map((n) => n[vk]);
  } else {
    draftPath.value = [];
  }
}

function onDropdownVisibleChange(open) {
  attrs.onDropdownVisibleChange?.(open);
  attrs["onDropdown-visible-change"]?.(open);
  if (!isOpenControlled.value) innerOpen.value = open;
  if (open) {
    panelKeyword.value = "";
    syncDraftFromSingleValue();
  } else {
    draftPath.value = [];
    panelKeyword.value = "";
  }
}

function onPanelSearch() {
  draftPath.value = [];
}

watch(panelKeyword, () => {
  draftPath.value = [];
});

function onNodeCheckChange(node, e) {
  if (!props.multiple) return;
  const vk = valueKey.value;
  const id = node[vk];
  const idStr = String(id);
  const cur = normalizeList(props.value);
  const checked = !!e?.target?.checked;
  const idx = cur.findIndex((x) => String(x) === idStr);
  let next;
  if (checked && idx === -1) next = [...cur, id];
  else if (!checked && idx !== -1) {
    next = cur.filter((_, i) => i !== idx);
  } else return;
  emitAll(next);
}

function onRowActivate(node, colIndex) {
  const vk = valueKey.value;
  const id = node[vk];
  const next = [...draftPath.value.slice(0, colIndex), id];
  draftPath.value = next;

  if (props.multiple) {
    return;
  }

  if (hasChildren(node)) {
    return;
  }
  emitAll(id);
  closeInner();
}

function setPanelKeyword(kw) {
  panelKeyword.value = kw ?? "";
  draftPath.value = [];
}

function clearPanelKeyword() {
  panelKeyword.value = "";
  draftPath.value = [];
}

function removeValue(id) {
  if (props.multiple) {
    const cur = normalizeList(props.value);
    const next = cur.filter((x) => String(x) !== String(id));
    emitAll(next);
    return;
  }
  if (String(props.value) === String(id)) {
    emitAll(undefined);
  }
}

defineExpose({
  /** 清空已选（等同 allow-clear 全清） */
  clear() {
    emitAll(props.multiple ? [] : undefined);
    draftPath.value = [];
    panelKeyword.value = "";
  },
  /** 多选时按 id 删除一项；单选且匹配则清空 */
  removeValue,
  /** 设置下拉面板内树查询关键字 */
  setPanelKeyword,
  /** 清空下拉面板内查询 */
  clearPanelKeyword,
  /** 读取下拉面板内查询关键字 */
  getPanelKeyword: () => panelKeyword.value,
  focus: () => selectRef.value?.focus?.(),
  blur: () => selectRef.value?.blur?.(),
  selectRef,
});
</script>

<style lang="scss">
.cc-dd {
  background: #fff;
  border-radius: 8px;
  min-width: min-content;
}
.cc-dd-search {
  padding: 8px;
  border-bottom: 1px solid rgba(5, 5, 5, 0.06);
}
.cc-dd-cols {
  display: flex;
  flex-direction: row;
  max-width: min(100vw - 16px, 960px);
}
.cc-dd-col {
  min-width: 148px;
  max-width: 220px;
  max-height: 280px;
  overflow-y: auto;
  border-right: 1px solid rgba(5, 5, 5, 0.06);
  &:last-child {
    border-right: none;
  }
}
.cc-dd-row {
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
  &.is-active {
    font-weight: 500;
    background: rgba(0, 0, 0, 0.04);
  }
  &.is-selected {
    background: #e6f4ff;
  }
}
.cc-dd-row-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cc-dd-arrow {
  margin-left: 6px;
  font-size: 10px;
  color: rgba(0, 0, 0, 0.45);
}
.cc-dd-hide-menu {
  display: none;
}
</style>
