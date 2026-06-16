<template>
  <FormItemRest>
    <a-tree-select ref="treeSelectRef" :class="attrs.class" :style="attrs.style" v-bind="treeSelectBind" :field-names="fieldNames"
      :tree-data="options" :multiple="multiple" :tree-checkable="multiple"
      :tree-check-strictly="multiple && checkStrictly" popup-class-name="cascader-check-tree-popup"
      :dropdown-render="dropdownRenderFn" :value="treeSelectDisplayValue" @update:value="onTreeSelectUpdateValue"
      show-checked-strategy="SHOW_ALL" @change="onTreeChange" @dropdown-visible-change="onDropdownVisibleChange" />
  </FormItemRest>
</template>

<script setup>
import {
  computed,
  defineComponent,
  h,
  inject,
  onMounted,
  provide,
  ref,
  resolveComponent,
  useAttrs,
  watch,
  nextTick,
} from "vue";
import { RightOutlined } from "@ant-design/icons-vue";
import FormItemRest, {
  useInjectFormItemContext,
} from "ant-design-vue/es/form/FormItemContext";

defineOptions({
  name: "CascaderCheck",
  inheritAttrs: false,
});

const DEBUG_KEEP_DROPDOWN_OPEN = false;

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
      label: "name",
      value: "id",
      children: "children",
    }),
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  checkStrictly: {
    type: Boolean,
    default: false,
  },
  showSelectAll: {
    type: Boolean,
    default: true,
  },
  treeNodeFilterProp: {
    type: String,
    default: undefined,
  },
});

const emit = defineEmits(["update:value", "change", "changeCascaderRadio"]);

const attrs = useAttrs();

const treeSelectRef = ref(null);
const dropdownPlacement = ref("bottomLeft");

const formItemContext = useInjectFormItemContext();
function touchFormItemFieldChange() {
  formItemContext.onFieldChange();
}

const MenuNodeRender = defineComponent({
  name: "MenuNodeRender",
  props: {
    menuNode: {
      type: null,
      default: null,
    },
  },
  setup(p) {
    return () => p.menuNode;
  },
});

const useCascadeDropdown = computed(
  () => !props.multiple || (props.multiple && props.checkStrictly),
);

const mergedAttrs = computed(() => {
  const a = { ...attrs };
  delete a.class;
  delete a.style;
  delete a.onChange;
  delete a["popup-class-name"];
  delete a.popupClassName;
  delete a.dropdownRender;
  delete a["dropdown-render"];
  return a;
});

function userControlsPlacement() {
  return "placement" in attrs || "placement" in mergedAttrs.value;
}

/** 预估级联面板宽度，右侧空间不足时用 bottomRight 向左展开 */
function adjustDropdownPlacementToViewport() {
  if (userControlsPlacement()) return;
  const inst = treeSelectRef.value;
  const root = inst?.$el;
  if (!root?.getBoundingClientRect) return;
  const tr = root.getBoundingClientRect();
  const vw = window.innerWidth;
  const margin = 8;
  const estimatedMenuWidth = 560;
  dropdownPlacement.value =
    tr.left + estimatedMenuWidth > vw - margin ? "bottomRight" : "bottomLeft";
}

const valueKey = computed(() => props.fieldNames.value ?? "value");
const labelKey = computed(() => props.fieldNames.label ?? "label");
const childrenKey = computed(() => props.fieldNames.children ?? "children");

const showSearchBar = computed(() => {
  if ("showSearch" in attrs || "show-search" in attrs) {
    if (attrs.showSearch === false || attrs["show-search"] === false) return false;
    return true;
  }
  return !!props.multiple;
});

const treeFilterProp = computed(
  () =>
    props.treeNodeFilterProp ??
    attrs["tree-node-filter-prop"] ??
    attrs.treeNodeFilterProp ??
    labelKey.value,
);

function nodeMatchesKeyword(node, needle, textKey, lk, vk) {
  const keys = [textKey, lk, vk, "title", "label", "name"];
  const seen = new Set();
  let hay = "";
  for (const k of keys) {
    if (k == null || k === "" || seen.has(k)) continue;
    seen.add(k);
    const v = node[k];
    if (v != null && v !== "") hay += `${String(v)}\n`;
  }
  return hay.toLowerCase().includes(needle);
}

function filterTreeByKeyword(nodes, kw, textKey, ck, vk, lk) {
  const needle = (kw || "").trim().toLowerCase();
  if (!needle) return nodes || [];
  function walk(list) {
    const out = [];
    for (const node of list) {
      const rawCh = node[ck];
      const chList = Array.isArray(rawCh) ? rawCh : [];
      const filteredChildren = chList.length ? walk(chList) : [];
      const selfMatch = nodeMatchesKeyword(node, needle, textKey, lk, vk);
      if (selfMatch || filteredChildren.length) {
        const clone = { ...node };
        if (filteredChildren.length) {
          clone[ck] = filteredChildren;
        } else if (selfMatch && chList.length) {
          clone[ck] = chList;
        } else {
          delete clone[ck];
        }
        out.push(clone);
      }
    }
    return out;
  }
  return walk(nodes || []);
}

function normalizeToPrimitiveList(arr) {
  if (!arr || !Array.isArray(arr)) return [];
  return arr.map((item) =>
    item != null && typeof item === "object" && "value" in item
      ? item.value
      : item,
  );
}

function collectAllIds(nodes) {
  const vk = valueKey.value;
  const ck = childrenKey.value;
  const out = [];
  if (!nodes?.length) return out;
  for (const node of nodes) {
    if (node[vk] != null) out.push(node[vk]);
    if (node[ck]?.length) out.push(...collectAllIds(node[ck]));
  }
  return out;
}

/** 全选相关：扁平 id 去重，保留首次出现顺序（树里不同节点可能同 value） */
function dedupeValueIds(ids) {
  if (!ids?.length) return [];
  const seen = new Set();
  const out = [];
  for (const id of ids) {
    const k = id == null ? "" : String(id);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(id);
  }
  return out;
}

const allIdsFlat = computed(() => dedupeValueIds(collectAllIds(props.options)));

const isAllChecked = computed(() => {
  if (!props.multiple || !props.checkStrictly || !props.showSelectAll)
    return false;
  const all = allIdsFlat.value;
  const cur = dedupeValueIds(
    normalizeToPrimitiveList(Array.isArray(props.value) ? props.value : []),
  );
  if (!all.length || cur.length !== all.length) return false;
  const s = new Set(cur.map(String));
  return all.every((id) => s.has(String(id)));
});

function findLabelById(nodes, id) {
  if (!nodes?.length) return undefined;
  const vk = valueKey.value;
  const lk = labelKey.value;
  const ck = childrenKey.value;
  for (const node of nodes) {
    if (node[vk] === id || String(node[vk]) === String(id)) return node[lk];
    const found = findLabelById(node[ck], id);
    if (found !== undefined) return found;
  }
  return undefined;
}

const treeSelectDisplayValue = computed(() => {
  const v = props.value;
  if (props.multiple) {
    const ids = normalizeToPrimitiveList(Array.isArray(v) ? v : []);
    if (!ids.length) return [];
    if (props.checkStrictly) {
      return ids.map((id) => ({
        value: id,
        label: findLabelById(props.options, id) ?? String(id),
      }));
    }
    return ids;
  }
  if (v === undefined || v === null || v === "") return undefined;
  return v;
});

function onTreeSelectUpdateValue(next) {
  if (props.multiple) {
    const v = normalizeToPrimitiveList(next);
    emit("update:value", v);
    emit("change", v);
  } else {
    emit("update:value", next);
    emit("change", next);
  }
  touchFormItemFieldChange();
}

function emitValue(next) {
  emit("update:value", next);
  emit("change", next);
  touchFormItemFieldChange();
}

function handleSelectAllChange(e) {
  if (e?.target?.checked) {
    const next = [...allIdsFlat.value];
    emitValue(next);
    emit("changeCascaderRadio", next, { selectAll: true });
  } else {
    emitValue([]);
    emit("changeCascaderRadio", [], { selectAll: false });
  }
}

function onTreeChange(val, labelList, extra) {
  if (props.multiple) {
    emit("changeCascaderRadio", normalizeToPrimitiveList(val), extra);
  } else {
    emit("changeCascaderRadio", val, extra);
  }
  touchFormItemFieldChange();
}

const cascadeSearch = ref("");
const activePrefix = ref([]);

const modelValueSingle = computed(() =>
  props.multiple ? undefined : props.value,
);

const cascadeSelectedSet = computed(() => {
  if (!props.multiple) return new Set();
  const arr = Array.isArray(props.value) ? props.value : [];
  return new Set(arr.map(String));
});

const filteredCascadeRoots = computed(() => {
  const roots = props.options || [];
  const kw = (cascadeSearch.value ?? "").trim();
  if (!kw) return roots;
  return filterTreeByKeyword(
    roots,
    kw,
    treeFilterProp.value,
    childrenKey.value,
    valueKey.value,
    labelKey.value,
  );
});

const cascadeColumns = computed(() => {
  const vk = valueKey.value;
  const ck = childrenKey.value;
  const cols = [filteredCascadeRoots.value];
  const prefix = activePrefix.value;
  for (let i = 0; i < prefix.length; i++) {
    const n = prefix[i];
    const ch = n[ck];
    if (ch && ch.length) cols.push(ch);
    else break;
  }
  return cols;
});

watch(
  () => props.options,
  () => {
    activePrefix.value = [];
  },
  { deep: true },
);

function expandFirstBranchWithChildren(roots) {
  const ck = childrenKey.value;
  const prefix = [];
  let list = roots || [];
  let guard = 0;
  while (list?.length && guard < 24) {
    guard++;
    const next = list.find((n) => n[ck] && n[ck].length);
    if (!next) break;
    prefix.push(next);
    list = next[ck] || [];
  }
  activePrefix.value = prefix;
}

watch(cascadeSearch, (v) => {
  if (!showSearchBar.value || !useCascadeDropdown.value) return;
  const cur = (v ?? "").trim();
  if (cur === "") {
    activePrefix.value = [];
    nextTick(() => {
      const roots = props.options || [];
      if (props.multiple) {
        defaultExpandFirstSecond(roots);
      } else {
        const val = props.value;
        const r = pathPrefixForSingleValue(val, roots);
        if (r && r.length) activePrefix.value = r;
        else defaultExpandFirstSecond(roots);
      }
    });
    return;
  }
  nextTick(() => {
    expandFirstBranchWithChildren(filteredCascadeRoots.value);
  });
});

function onSelectorSearchValueUpdate(v) {
  const s = v ?? "";
  cascadeSearch.value = s;
  if (typeof attrs["onUpdate:searchValue"] === "function") {
    attrs["onUpdate:searchValue"](s);
  }
}

const treeSelectBind = computed(() => {
  const a = { ...mergedAttrs.value };
  if (useCascadeDropdown.value && showSearchBar.value) {
    delete a.searchValue;
    delete a["search-value"];
    delete a.onUpdateSearchValue;
    delete a["onUpdate:searchValue"];
    a.searchValue = cascadeSearch.value;
    a["onUpdate:searchValue"] = onSelectorSearchValueUpdate;
  }
  if (useCascadeDropdown.value) {
    if (!("getPopupContainer" in attrs) && !("get-popup-container" in attrs)) {
      a.getPopupContainer = () => document.body;
    }
  }
  if (DEBUG_KEEP_DROPDOWN_OPEN) {
    delete a.open;
    delete a.defaultOpen;
    a.open = true;
  }
  if (!userControlsPlacement()) {
    a.placement = dropdownPlacement.value;
  }
  // FormItemRest 会切断 context，需把外层 form-item 的 id 显式传给 tree-select，供 scrollToField 定位
  if (!('id' in a) && formItemContext.id?.value) {
    a.id = formItemContext.id.value;
  }
  return a;
});

function pathPrefixForSingleValue(val, roots) {
  if (props.multiple || val === undefined || val === null || val === "")
    return null;
  const vk = valueKey.value;
  const ck = childrenKey.value;
  let foundPrefix = null;
  const walk = (nodes, ancestors = []) => {
    if (!nodes?.length) return false;
    for (const node of nodes) {
      if (String(node[vk]) === String(val)) {
        foundPrefix = ancestors;
        return true;
      }
      const ch = node[ck];
      if (ch?.length && walk(ch, [...ancestors, node])) return true;
    }
    return false;
  };
  walk(roots || []);
  return foundPrefix && foundPrefix.length ? foundPrefix : null;
}

function defaultExpandFirstSecond(roots) {
  const ck = childrenKey.value;
  const list = roots || [];
  const first = list.find((r) => r[ck] && r[ck].length);
  activePrefix.value = first ? [first] : [];
}

function runCascadeOpenInit() {
  if (!useCascadeDropdown.value) return;
  cascadeSearch.value = "";
  nextTick(() => {
    const roots = props.options || [];
    if (props.multiple) {
      defaultExpandFirstSecond(roots);
      return;
    }
    const v = props.value;
    const restored = pathPrefixForSingleValue(v, roots);
    if (restored) activePrefix.value = restored;
    else defaultExpandFirstSecond(roots);
  });
}

function onDropdownVisibleChange(open) {
  attrs.onDropdownVisibleChange?.(open);
  attrs["onDropdown-visible-change"]?.(open);
  if (DEBUG_KEEP_DROPDOWN_OPEN) {
    if (open) runCascadeOpenInit();
    return;
  }
  if (open) {
    adjustDropdownPlacementToViewport();
    nextTick(() => {
      if (useCascadeDropdown.value) runCascadeOpenInit();
    });
  }
}

onMounted(() => {
  if (!DEBUG_KEEP_DROPDOWN_OPEN) return;
  nextTick(() => {
    runCascadeOpenInit();
  });
});

function onCascadeRowClick(node, colIdx) {
  const vk = valueKey.value;
  const ck = childrenKey.value;
  if (props.multiple) {
    activePrefix.value = activePrefix.value.slice(0, colIdx);
    activePrefix.value[colIdx] = node;
    activePrefix.value = activePrefix.value.slice(0, colIdx + 1);
    return;
  }
  const hasCh = node[ck] && node[ck].length;
  if (hasCh) {
    activePrefix.value = activePrefix.value.slice(0, colIdx);
    activePrefix.value[colIdx] = node;
    activePrefix.value = activePrefix.value.slice(0, colIdx + 1);
  } else {
    const roots = props.options || [];
    const r = pathPrefixForSingleValue(node[vk], roots);
    activePrefix.value = r ?? [];
  }
  emitValue(node[vk]);
  emit("changeCascaderRadio", node[vk], { mode: "cascade-panel" });
}

function onCascadeCheckboxChange(node, e) {
  const checked = e?.target?.checked;
  const vk = valueKey.value;
  const idStr = String(node[vk]);
  const raw = normalizeToPrimitiveList(
    Array.isArray(props.value) ? props.value : [],
  );
  const idx = raw.findIndex((x) => String(x) === idStr);
  let next;
  if (checked && idx === -1) next = [...raw, node[vk]];
  else if (!checked && idx !== -1) {
    next = raw.filter((x) => String(x) !== idStr);
  } else return;
  emitValue(next);
  emit("changeCascaderRadio", next, { mode: "cascade-panel" });
}

const PANEL_CTX = Symbol("cascaderCheckTreePanel");

const TreeDropdownPanel = defineComponent({
  name: "CascaderCheckTreeDropdownPanel",
  props: {
    menuNode: { type: null, default: null },
  },
  setup(p) {
    const ctx = inject(PANEL_CTX);
    const ACheckbox = resolveComponent("ACheckbox");
    return () => {
      const pr = ctx.parentProps;
      const hideTree = ctx.useCascadeDropdown.value;
      const vk = ctx.valueKey.value;
      const lk = ctx.labelKey.value;
      const ck = ctx.childrenKey.value;
      const children = [];

      if (hideTree && pr.multiple && pr.checkStrictly && pr.showSelectAll) {
        children.push(
          h(
            "div",
            {
              class: "template-checkbox-all",
              onMousedown: (e) => e.preventDefault(),
            },
            [
              h(
                ACheckbox,
                {
                  checked: ctx.isAllChecked.value,
                  style: {
                    padding: "0 12px",
                  },
                  onChange: ctx.handleSelectAllChange,
                },
                { default: () => [h("span", {}, "全部")] },
              ),
            ],
          ),
        );
      }

      if (hideTree) {
        children.push(
          h(
            "div",
            {
              class: "cascader-check-dd-menu",
              onMousedown: (e) => e.preventDefault(),
            },
            [
              h(
                "div",
                { class: "cascader-check-dd-columns" },
                ctx.cascadeColumns.value.map((col, colIdx) =>
                  h(
                    "div",
                    { key: colIdx, class: "cascader-check-dd-column" },
                    col.map((node) =>
                      h(
                        "div",
                        {
                          key: String(node[vk]),
                          class: [
                            "cascader-check-dd-item",
                            {
                              "is-active": ctx.activePrefix.value[colIdx] === node,
                              "is-selected":
                                !pr.multiple &&
                                ctx.modelValueSingle.value !== undefined &&
                                ctx.modelValueSingle.value !== null &&
                                ctx.modelValueSingle.value !== "" &&
                                String(ctx.modelValueSingle.value) ===
                                String(node[vk]),
                            },
                          ],
                          onClick: () => ctx.onCascadeRowClick(node, colIdx),
                        },
                        [
                          pr.multiple
                            ? h(
                              "span",
                              {
                                class: "cascader-check-dd-item-cb",
                                onClick: (e) => e.stopPropagation(),
                              },
                              [
                                h(ACheckbox, {
                                  checked: ctx.cascadeSelectedSet.value.has(
                                    String(node[vk]),
                                  ),
                                  disabled: node.disabled,
                                  onChange: (ev) =>
                                    ctx.onCascadeCheckboxChange(node, ev),
                                }),
                              ],
                            )
                            : h("span", {
                              class: [
                                "cascader-check-dd-item-radio",
                                {
                                  "is-checked":
                                    ctx.modelValueSingle.value !== undefined &&
                                    ctx.modelValueSingle.value !== null &&
                                    ctx.modelValueSingle.value !== "" &&
                                    String(ctx.modelValueSingle.value) ===
                                    String(node[vk]),
                                },
                              ],
                              "aria-hidden": true,
                            }),
                          h(
                            "span",
                            { class: "cascader-check-dd-item-label" },
                            node[lk],
                          ),
                          node[ck] && node[ck].length
                            ? h(RightOutlined, {
                              class: "cascader-check-dd-item-arrow",
                            })
                            : null,
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      }

      children.push(
        h(
          "div",
          {
            class: hideTree
              ? "cascader-check-dd-tree-sr-only"
              : "cascader-check-dd-tree-visible",
          },
          [h(MenuNodeRender, { menuNode: p.menuNode })],
        ),
      );

      return h("div", { class: "cascader-check-dropdown-root" }, children);
    };
  },
});

provide(PANEL_CTX, {
  parentProps: props,
  useCascadeDropdown,
  showSearchBar,
  cascadeSearch,
  cascadeColumns,
  activePrefix,
  valueKey,
  labelKey,
  childrenKey,
  isAllChecked,
  modelValueSingle,
  cascadeSelectedSet,
  handleSelectAllChange,
  onCascadeRowClick,
  onCascadeCheckboxChange,
});

function dropdownRenderFn(opt) {
  void cascadeSearch.value;
  void cascadeColumns.value;
  void activePrefix.value.length;
  return h(TreeDropdownPanel, { menuNode: opt?.menuNode });
}
</script>

<style lang="scss">
.cascader-check-tree-popup {
  z-index: 1200 !important;
  width: fit-content !important;
  min-width: fit-content !important;
  max-width: calc(100vw - 16px);
}

.cascader-check-dropdown-root {
  width: fit-content;
  overflow: hidden;
  min-width: min-content;
}

.cascader-check-dd-columns {
  display: flex;
  flex-direction: row;
}

.cascader-check-dd-column {
  flex: 0 0 180px;
  width: 180px;
  box-sizing: border-box;
  max-height: 280px;
  overflow-y: auto;
  border-right: 1px solid rgba(5, 5, 5, 0.06);
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.28) transparent;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.22);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &:last-child {
    border-right: none;
  }
}

.cascader-check-dd-item {
  display: flex;
  align-items: center;
  padding: 5px 12px;
  cursor: pointer;
  font-size: 14px;
  line-height: 22px;
  white-space: nowrap;

  &:hover {
    background: var(--color-primary-bg);
  }

  &.is-active {
    font-weight: 500;
    background: var(--color-primary-bg);
  }

  &.is-selected {
    background: var(--color-primary-bg);
  }
}

.cascader-check-dd-item-cb {
  margin-right: 8px;
  display: inline-flex;
  align-items: center;
}

.cascader-check-dd-item-radio {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-right: 8px;
  box-sizing: border-box;
  border: 1px solid #d9d9d9;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  pointer-events: none;
}

.cascader-check-dd-item-radio.is-checked {
  border-color: var(--color-primary);
}

.cascader-check-dd-item-radio.is-checked::after {
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
}

.cascader-check-dd-item-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cascader-check-dd-item-arrow {
  margin-left: 8px;
  font-size: 10px;
  color: rgba(0, 0, 0, 0.45);
}

.cascader-check-dd-tree-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
  pointer-events: none;
}

.cascader-check-dd-tree-visible {
  min-width: 200px;
}
</style>
