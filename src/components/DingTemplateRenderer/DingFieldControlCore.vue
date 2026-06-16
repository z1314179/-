<template>
  <div class="ding-field-control-core" v-if="!isDetail">
    <template v-if="item.type">
      <a-auto-complete v-if="item.componentName === 'TextField' && item.type === 'DDcompleteField'"
        :style="controlStyle" v-model:value="formData[fieldKey]" :options="fieldOptions"
        :filter-option="ddSelectFilterOption">
        <a-input :placeholder="fieldPlaceholder" allow-clear />
      </a-auto-complete>
      <a-auto-complete v-else-if="item.componentName === 'TextField' && item.type === 'company'" :style="controlStyle"
        v-model:value="formData[fieldKey]" :options="companySelectOptions" :filter-option="ddSelectFilterOption">
        <a-input :placeholder="fieldPlaceholder" allow-clear />
      </a-auto-complete>
      <a-auto-complete v-else-if="item.componentName === 'TextField' && item.type === 'user'" :style="controlStyle"
        v-model:value="formData[fieldKey]" :options="[]" :filter-option="ddSelectFilterOption">
        <a-input :placeholder="fieldPlaceholder" allow-clear />
      </a-auto-complete>
      <a-input v-else :style="controlStyle" :value="`暂不支持组件：${item.componentName}`" />
    </template>
    <template v-else>
      <a-input v-if="item.componentName === 'TextField'" :style="controlStyle" allow-clear
        :placeholder="fieldPlaceholder" v-model:value="formData[fieldKey]" />
      <a-textarea v-else-if="item.componentName === 'TextareaField'" :style="controlStyle" allow-clear
        :placeholder="fieldPlaceholder" v-model:value="formData[fieldKey]" :auto-size="textareaAutoSize" />
      <a-input-number v-else-if="item.componentName === 'NumberField'" :style="controlStyle" allow-clear
        :placeholder="fieldPlaceholder" v-model:value="formData[fieldKey]" />
      <a-input-number v-else-if="item.componentName === 'MoneyField'" :style="controlStyle" allow-clear
        :placeholder="fieldPlaceholder" v-model:value="formData[fieldKey]" :precision="2" />
      <a-select v-else-if="item.componentName === 'DDSelectField'" :style="controlStyle" allow-clear
        :placeholder="fieldPlaceholder" show-search option-filter-prop="label" v-model:value="formData[fieldKey]"
        :options="fieldOptions" :field-names="selectFieldNames" />
      <!-- //设置搜索字段 -->
      <a-select v-else-if="item.componentName === 'DDMultiSelectField'" :style="controlStyle" allow-clear
        mode="multiple" :placeholder="fieldPlaceholder" show-search option-filter-prop="label"
        v-model:value="formData[fieldKey]" :options="fieldOptions" :field-names="selectFieldNames" />

      <a-date-picker v-else-if="item.componentName === 'DDDateField'" :style="controlStyle" allow-clear
        v-model:value="formData[fieldKey]" :placeholder="fieldPlaceholder" :format="'YYYY-MM-DD'"
        :value-format="'YYYY-MM-DD'" />

      <a-range-picker v-else-if="item.componentName === 'DDDateRangeField'" :style="controlStyle" allow-clear
        v-model:value="formData[fieldKey]" :format="'YYYY-MM-DD'" :value-format="'YYYY-MM-DD'" />

      <a-input v-else-if="item.componentName === 'PhoneField'" :style="controlStyle" allow-clear
        :placeholder="fieldPlaceholder" v-model:value="formData[fieldKey]" />

      <a-input v-else-if="item.componentName === 'IdCardField'" :style="controlStyle" allow-clear
        :placeholder="fieldPlaceholder" v-model:value="formData[fieldKey]" />

      <!-- <Upload v-else-if="item.componentName === 'DDAttachment'" :style="controlStyle" @change="onAttachmentChange">
      <a-button>上传附件</a-button>
    </Upload> -->

      <!-- <Upload v-else-if="item.componentName === 'DDPhotoField'" :style="controlStyle" @change="onPhotoChange">
      <a-button>上传图片</a-button>
    </Upload> -->

      <a-rate v-else-if="item.componentName === 'StarRatingField'" :style="controlStyle"
        v-model:value="formData[fieldKey]" />

      <a-select v-else-if="
        item.componentName === 'InnerContactField' ||
        item.componentName === 'ExternalContactField'
      " :style="controlStyle" allow-clear :placeholder="fieldPlaceholder" v-model:value="formData[fieldKey]"
        :options="[]" />

      <CascaderCheck v-else-if="
        item.componentName === 'DepartmentField' ||
        item.componentName === 'IndustryDepartmentField'
      " :style="controlStyle" :value="formData[fieldKey]" :options="departmentCascaderOptions"
        :placeholder="fieldPlaceholder" allow-clear change-on-select @change="(v) => (formData[fieldKey] = v)" />

      <a-cascader v-else-if="item.componentName === 'AddressField'" :style="controlStyle"
        v-model:value="formData[fieldKey]" :options="cityData" :field-names="cityFieldNames"
        :placeholder="fieldPlaceholder" allow-clear show-search />

      <CascaderCheck v-else-if="item.componentName === 'CascadeField'" :style="controlStyle" :value="formData[fieldKey]"
        :options="[]" :placeholder="fieldPlaceholder" allow-clear @change="(v) => (formData[fieldKey] = v)" />

      <a-input v-else :style="controlStyle" :value="`暂不支持组件：${item.componentName}`" />
    </template>
  </div>

  <div v-else>
    {{ detailDisplayValue || "-" }}
  </div>

</template>

<script setup>
import cityData from "@/utils/city.json";
import Upload from "@/components/upload/index.vue";
import CascaderCheck from "@/components/system/cascaderCheck.vue";
import {
  parseDingSelectOptions,
  resolveDingSelectDisplayValue,
} from "./dingFieldItemNormalize.js";
import { computed, inject, onMounted, ref, unref } from "vue";
import { getDepartmentList } from "@/api/users";
import { nFormat } from "@/utils/com.js";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  formData: {
    type: Object,
    required: true,
  },
  /** 写入 formData 的键（顶层表单字段 id 或表格行上的列键） */
  fieldKey: {
    type: String,
    required: true,
  },
  /** 表格单元格内略紧凑的多行输入 */
  compactTextarea: {
    type: Boolean,
    default: false,
  },
  isDetail: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["upload-done"]);

const subjectOptionList = inject("subjectOptionList");

const companySelectOptions = computed(() => {
  const seen = new Set()
  return (unref(subjectOptionList) ?? []).reduce((list, row) => {
    const name = row.companyName
    if (!name || seen.has(name)) return list
    seen.add(name)
    list.push({
      key: row.id,
      label: name,
      value: name,
    })
    return list
  }, [])
})


const textareaAutoSize = computed(() => ({ minRows: 1, maxRows: 6 }),
);

const fieldPlaceholder = computed(
  () => {
    let str = props.item.props?.placeholder ?? props.item.placeholder ?? ""
    return str + props.item.label

  },
);

/** 钉钉选项统一为中文 label 作 value，并按名称去重 */
const selectFieldNames = { label: "label", value: "value" };

const fieldOptions = computed(() => {
  const normalized = props.item.options;
  if (Array.isArray(normalized) && normalized.length) {
    return parseDingSelectOptions(normalized);
  }
  return parseDingSelectOptions(props.item.props?.options);
});

function ddSelectFilterOption(input, option) {
  return String(option?.value ?? "")
    .toLowerCase()
    .includes((input || "").toLowerCase());
}

const detailDisplayValue = computed(() => {
  const v = props.formData[props.fieldKey];
  const t = props.item.componentName;
  if (t === "DDSelectField" || t === "DDMultiSelectField") {
    return resolveDingSelectDisplayValue(v);
  }
  if (t === "MoneyField") {
    return nFormat(v);
  }
  if (t === "AddressField") {
    if (Array.isArray(v)) return v.join(" / ");
    return v ?? "";
  }
  if (v === undefined || v === null) return "";
  if (Array.isArray(v)) return v.join("、");
  return v;
});

/** 控件默认占满可用宽度 */
const controlStyle = computed(() => ({ width: "100%" }));

const mapOrgToCascader = (arr = []) => {
  return arr.map((node) => ({
    label: node.name,
    value: node.id,
    children:
      Array.isArray(node.children) && node.children.length
        ? mapOrgToCascader(node.children)
        : undefined,
  }));
};

let departmentListPromise = null;
const loadDepartmentTreeOnce = () => {
  if (!departmentListPromise) {
    departmentListPromise = getDepartmentList()
      .then((res) => mapOrgToCascader(res?.data || []))
      .catch(() => []);
  }
  return departmentListPromise;
};

const departmentCascaderOptions = ref([]);
const initDepartmentOptions = async () => {
  const needDept =
    props.item.componentName === "DepartmentField" ||
    props.item.componentName === "IndustryDepartmentField";
  if (!needDept) return;
  departmentCascaderOptions.value = await loadDepartmentTreeOnce();
};

onMounted(() => {
  initDepartmentOptions();
});

const cityFieldNames = { label: "ext_name", value: "ext_name", children: "children" };

const onAttachmentChange = (uploadedPath) => {
  const key = props.fieldKey;
  const currentValue = props.formData[key];
  if (Array.isArray(currentValue)) {
    props.formData[key] = [...currentValue, uploadedPath];
  } else if (currentValue) {
    props.formData[key] = [currentValue, uploadedPath];
  } else {
    props.formData[key] = [uploadedPath];
  }
  emit("upload-done", key);
};

const onPhotoChange = (uploadedPath) => {
  const key = props.fieldKey;
  props.formData[key] = uploadedPath;
  emit("upload-done", key);
};
</script>

<style scoped lang="scss">
.ding-field-control-core {
  width: 100%;
}
</style>
