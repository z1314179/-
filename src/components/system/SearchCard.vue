<template>
  <div class=" form-card pd-x-large pd-y-small">
    <div class="flex form-search" ref="formSearch" :class="exp ? 'exp' : ''">
      <div class="flex-1" style="min-width: 0">
        <slot></slot>
      </div>
      <div class="pd-y-small form-search-right">
        <slot name="right"></slot>
        <a-button v-if="isExp" type="link" @click="handleExp" class="mg-l-medium">{{ exp ? "展开" : "收起" }}
          <DownOutlined v-if="exp" style="margin-left: 5px" />
          <UpOutlined v-else style="margin-left: 5px" />
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineOptions({
  name: "SearchCard",
});
import { DownOutlined, UpOutlined } from "@ant-design/icons-vue";
import { ref, onMounted, defineProps } from "vue";
const props = defineProps({
  isExp: {
    type: Boolean,
    default: true,
  },
});
const formSearch = ref(null);
const exp = ref(true);
if (!props.isExp) {
  exp.value = false;
}
onMounted(() => { });
const handleExp = () => {
  exp.value = !exp.value;
};
</script>

<style lang="scss" scoped>
.form-card {
  background: #ffffff;
  border-radius: 6px;
  border: 0px solid rgba(0, 0, 0, 0.85);
}

:deep(.ant-form-item) {
  margin: 8px 0;
  margin-right: 24px;

  .ant-form-item-control-input-content {

    .ant-input-affix-wrapper,
    .ant-select,
    >.ant-input {
      width: 260px;
    }

    .ant-picker-range {
      width: 260px !important;
    }
  }
}

.form-search {
  height: fit-content;
  overflow: hidden;
  background: #fff;
}

.form-search.exp {
  height: 48px;
}
</style>
