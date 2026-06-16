<template>
  <a-tree-select
    v-model:value="treeSelectModel"
    :class="attrs.class"
    :style="attrs.style"
    v-bind="mergedAttrs"
    :field-names="fieldNames"
    :tree-data="options"
    :multiple="multiple"
    :tree-checkable="multiple"
    :tree-check-strictly="multiple && checkStrictly"
    :dropdown-render="dropdownRenderFn1"
    popup-class-name="cascader-check-tree-popup"
  />
</template>

<script setup>
import {
  computed,
  useAttrs,
  h,
  resolveComponent,
  defineComponent,
  ref,
  watch,
  onMounted,
  nextTick,
} from "vue";
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
      label: "label",
      value: "value",
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
});

const emit = defineEmits(["update:value", "changeCascaderRadio"]);

const attrs = useAttrs();

const mergedAttrs = computed(() => {
  const a = { ...attrs };
  delete a.class;
  delete a.style;
  delete a.onChange;
  delete a["popup-class-name"];
  delete a.popupClassName;
  /* 联级自绘下拉时，内置搜索会画在隐藏的 menu 里；搜索改由面板内 Input + 整树过滤 */
  if (useCascadeDropdown.value) {
    delete a.showSearch;
    delete a["show-search"];
    delete a.treeNodeFilterProp;
    delete a["tree-node-filter-prop"];
  }
  return a;
});

const valueKey = computed(() => props.fieldNames.value ?? "value");
const labelKey = computed(() => props.fieldNames.label ?? "label");
const childrenKey = computed(() => props.fieldNames.children ?? "children");

const showSearchBar = computed(
  () => !!(attrs.showSearch || attrs["show-search"])
);

/** 与 a-tree-select 的 tree-node-filter-prop 一致：按该字段做整树过滤 */
const treeFilterProp = computed(
  () =>
    attrs["tree-node-filter-prop"] ??
    attrs.treeNodeFilterProp ??
    labelKey.value
);

function filterTreeByKeyword(nodes, kw, textKey, ck) {
  const needle = (kw || "").trim().toLowerCase();
  if (!needle) return nodes;
  function walk(list) {
    const out = [];
    for (const node of list) {
      const rawCh = node[ck];
      const chList = Array.isArray(rawCh) ? rawCh : [];
      const filteredChildren = chList.length ? walk(chList) : [];
      const text = String(node[textKey] ?? "");
      const selfMatch = text.toLowerCase().includes(needle);
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
      : item
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

const allIdsFlat = computed(() => collectAllIds(props.options));

const isAllChecked = computed(() => {
  if (!props.multiple || !props.checkStrictly || !props.showSelectAll) return false;
  const all = allIdsFlat.value;
  const cur = normalizeToPrimitiveList(
    Array.isArray(props.value) ? props.value : []
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

/** 多选+strict 或单选：联级多列；否则保留树形 menuNode */
const useCascadeDropdown = computed(
  () => !props.multiple || (props.multiple && props.checkStrictly)
);

const treeSelectModel = computed({
  get() {
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
  },
  set(next) {
    if (props.multiple) {
      emit("update:value", normalizeToPrimitiveList(next));
    } else {
      emit("update:value", next);
    }
  },
});

function handleSelectAllChange(e) {
  if (e?.target?.checked) {
    const next = [...allIdsFlat.value];
    emit("update:value", next);
    emit("changeCascaderRadio", next, { selectAll: true });
  } else {
    emit("update:value", []);
    emit("changeCascaderRadio", [], { selectAll: false });
  }
}

function isChangeOnSelectAttr() {
  return (
    attrs.changeOnSelect === true ||
    attrs.changeOnSelect === "" ||
    attrs["change-on-select"] === true ||
    attrs["change-on-select"] === ""
  );
}

const CascadeTreeDropdownBody = defineComponent({
  name: "CascadeTreeDropdownBody",
  props: {
    roots: { type: Array, default: () => [] },
    vk: { type: String, required: true },
    lk: { type: String, required: true },
    ck: { type: String, required: true },
    /** 搜索匹配字段，与 tree-node-filter-prop 一致 */
    filterKey: { type: String, required: true },
    multiple: { type: Boolean, default: false },
    /** 与 attrs 一致，是否可选中间节点（单选） */
    changeOnSelect: { type: Boolean, default: false },
    showSearch: { type: Boolean, default: false },
    modelValue: { type: [String, Number, Array], default: undefined },
  },
  emits: ["update:modelValue"],
  setup(p, { emit }) {
    const searchKeyword = ref("");
    const activePrefix = ref([]);

    watch(
      () => p.roots,
      () => {
        activePrefix.value = [];
      },
      { deep: true }
    );

    watch(searchKeyword, () => {
      if (p.showSearch) activePrefix.value = [];
    });

    function defaultExpandFirstSecond() {
      const roots = p.roots || [];
      const first = roots.find((r) => r[p.ck] && r[p.ck].length);
      activePrefix.value = first ? [first] : [];
    }

    function pathPrefixForSingleValue(val) {
      if (p.multiple || val === undefined || val === null || val === "")
        return null;
      let foundPrefix = null;
      const walk = (nodes, ancestors = []) => {
        if (!nodes?.length) return false;
        for (const node of nodes) {
          if (String(node[p.vk]) === String(val)) {
            foundPrefix = ancestors;
            return true;
          }
          const ch = node[p.ck];
          if (ch?.length && walk(ch, [...ancestors, node])) return true;
        }
        return false;
      };
      walk(p.roots);
      return foundPrefix && foundPrefix.length ? foundPrefix : null;
    }

    onMounted(() => {
      nextTick(() => {
        const restored = pathPrefixForSingleValue(p.modelValue);
        if (restored) activePrefix.value = restored;
        else defaultExpandFirstSecond();
      });
    });

    const filteredRoots = computed(() => {
      const roots = p.roots || [];
      if (!p.showSearch) return roots;
      return filterTreeByKeyword(
        roots,
        searchKeyword.value,
        p.filterKey,
        p.ck
      );
    });

    const columns = computed(() => {
      const cols = [];
      cols.push(filteredRoots.value);
      const prefix = activePrefix.value;
      for (let i = 0; i < prefix.length; i++) {
        const n = prefix[i];
        const ch = n[p.ck];
        if (ch && ch.length) cols.push(ch);
        else break;
      }
      return cols;
    });

    const selectedIdSet = computed(() => {
      if (!p.multiple) return new Set();
      const arr = Array.isArray(p.modelValue) ? p.modelValue : [];
      return new Set(arr.map(String));
    });

    function patchIds(next) {
      emit("update:modelValue", next);
    }

    function onRowClick(node, colIdx) {
      if (p.multiple) {
        activePrefix.value = activePrefix.value.slice(0, colIdx);
        activePrefix.value[colIdx] = node;
        activePrefix.value = activePrefix.value.slice(0, colIdx + 1);
        return;
      }
      const hasCh = node[p.ck] && node[p.ck].length;
      if (hasCh) {
        activePrefix.value = activePrefix.value.slice(0, colIdx);
        activePrefix.value[colIdx] = node;
        activePrefix.value = activePrefix.value.slice(0, colIdx + 1);
      }
      if (p.changeOnSelect || !hasCh) {
        emit("update:modelValue", node[p.vk]);
      }
    }

    function onCheckboxChange(node, e) {
      const checked = e?.target?.checked;
      const id = String(node[p.vk]);
      const cur = Array.isArray(p.modelValue)
        ? p.modelValue.map(String)
        : [];
      const idx = cur.indexOf(id);
      let next;
      if (checked && idx === -1) next = [...cur, id];
      else if (!checked && idx !== -1) {
        next = cur.filter((_, i) => i !== idx);
      } else return;
      patchIds(next);
    }

    return () => {
      const ACheckbox = resolveComponent("ACheckbox");
      const AInput = resolveComponent("AInput");
      return h("div", { class: "cascader-check-dd-menu" }, [
        p.showSearch
          ? h(
              "div",
              {
                class: "cascader-check-dd-search-wrap",
                onMousedown: (e) => e.preventDefault(),
              },
              [
                h(AInput, {
                  value: searchKeyword.value,
                  "onUpdate:value": (v) => {
                    searchKeyword.value = v;
                  },
                  allowClear: true,
                  placeholder: "搜索",
                }),
              ]
            )
          : null,
        h(
          "div",
          { class: "cascader-check-dd-columns" },
          columns.value.map((col, colIdx) =>
            h(
              "div",
              { key: colIdx, class: "cascader-check-dd-column" },
              col.map((node) =>
                h(
                  "div",
                  {
                    key: String(node[p.vk]),
                    class: [
                      "cascader-check-dd-item",
                      {
                        "is-active": activePrefix.value[colIdx] === node,
                        "is-selected":
                          !p.multiple &&
                          String(p.modelValue) === String(node[p.vk]),
                      },
                    ],
                    onClick: () => onRowClick(node, colIdx),
                  },
                  [
                    p.multiple
                      ? h(
                          "span",
                          {
                            class: "cascader-check-dd-item-cb",
                            onClick: (e) => e.stopPropagation(),
                          },
                          [
                            h(ACheckbox, {
                              checked: selectedIdSet.value.has(
                                String(node[p.vk])
                              ),
                              disabled: node.disabled,
                              onChange: (ev) => onCheckboxChange(node, ev),
                            }),
                          ]
                        )
                      : null,
                    h("span", { class: "cascader-check-dd-item-label" }, node[p.lk]),
                    node[p.ck] && node[p.ck].length
                      ? h(RightOutlined, {
                          class: "cascader-check-dd-item-arrow",
                        })
                      : null,
                  ]
                )
              )
            )
          )
        ),
      ]);
    };
  },
});

function dropdownRenderFn({ menuNode }) {
  console.log(menuNode);
  return menuNode;
  const hideTree = useCascadeDropdown.value;
  const children = [];

  if (
    hideTree &&
    props.multiple &&
    props.checkStrictly &&
    props.showSelectAll
  ) {
    const ACheckbox = resolveComponent("ACheckbox");
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
              checked: isAllChecked.value,
              class: "pd-x-large",
              onChange: handleSelectAllChange,
            },
            {
              default: () =>
                h("span", { class: "" }, '全部'),
            }
          ),
        ]
      )
    );
  }

  if (hideTree) {
    children.push(
      h(CascadeTreeDropdownBody, {
        roots: props.options,
        vk: valueKey.value,
        lk: labelKey.value,
        ck: childrenKey.value,
        filterKey: treeFilterProp.value,
        multiple: props.multiple,
        changeOnSelect: isChangeOnSelectAttr(),
        showSearch: showSearchBar.value,
        modelValue: props.value,
        "onUpdate:modelValue": (v) => {
          emit("update:value", v);
          emit("changeCascaderRadio", v, { mode: "cascade-panel" });
        },
      })
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
      [menuNode]
    )
  );

  return h("div", { class: "cascader-check-dropdown-root" }, children);
}

function onTreeChange(val, labelList, extra) {
  if (props.multiple) {
    emit("changeCascaderRadio", normalizeToPrimitiveList(val), extra);
  } else {
    emit("changeCascaderRadio", val, extra);
  }
}
</script>

<style lang="scss">
.cascader-check-dropdown-root {
  background: #fff;
  border-radius: 8px;
  box-shadow:
    0 6px 16px 0 rgba(0, 0, 0, 0.08),
    0 3px 6px -4px rgba(0, 0, 0, 0.12),
    0 9px 28px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  min-width: min-content;
}
.cascader-check-dd-menu .cascader-check-dd-search-wrap {
  padding: 8px;
  border-bottom: 1px solid rgba(5, 5, 5, 0.06);
}
.cascader-check-dd-columns {
  display: flex;
  flex-direction: row;
  max-width: min(100vw - 16px, 960px);
}
.cascader-check-dd-column {
  min-width: 148px;
  max-width: 220px;
  max-height: 280px;
  overflow-y: auto;
  border-right: 1px solid rgba(5, 5, 5, 0.06);
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
.cascader-check-dd-item-cb {
  margin-right: 8px;
  display: inline-flex;
  align-items: center;
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
