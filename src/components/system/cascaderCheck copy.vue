<template>
  <div>
    <!-- 单选       :displayRender="({ labels }) => labels.pop()" -->
    <a-cascader
      :value="values"
      :options="optionsList.arr"
      showCheckedStrategy="SHOW_CHILD"
      v-bind="$attrs"
      :fieldNames="fieldNames"
      @change="change"
      :multiple="multiple"
    >
    </a-cascader>
  </div>
</template>

<script setup>
import { defineProps, watch, ref, reactive, computed } from "vue";
defineOptions({
  name: "",
});
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
});
const emit = defineEmits(["update:value", "changeCascaderRadio"]);
const renderCustom = ({ labels }) => {
  if (props.multiple) {
    return labels;
  } else {
    return labels.pop();
  }
};
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
const values = computed(() => {
  if (!props.value) return [];
  let depAll = optionsList.value.obj;
  if (props.multiple) {
    return props.value.map((item) => {
      return depAll[item]?.split(",") || [];
    });
  } else {
    return depAll[props.value]?.split(",") || [];
  }
});
const change = (value, selectedOptions) => {
  if (!value) {
    emit("update:value", value);
    emit("changeCascader", value);
    return;
  }
  let values;
  if (props.multiple) {
    values = value.map((item) => {
      return item[item.length - 1];
    });
  } else {
    values = value[value.length - 1];
  }
  emit("update:value", values);
  emit("changeCascader", values, value);
};
</script>

<style lang="scss" scoped></style>
