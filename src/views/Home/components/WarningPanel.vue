<template>
  <div class="warning-panel">
    <div v-for="item in items" :key="item.id" class="warning-row">
      <span class="warning-text">{{ item.content }}</span>
      <a-checkbox v-model:checked="checkedMap[item.id]" />
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from "vue";

defineOptions({ name: "HomeWarningPanel" });

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
});

const checkedMap = reactive({});

watch(
  () => props.items,
  (list) => {
    list.forEach((row) => {
      if (checkedMap[row.id] === undefined) checkedMap[row.id] = false;
    });
  },
  { immediate: true, deep: true },
);
</script>

<style scoped lang="scss">
.warning-panel {
  height: 100%;
  overflow: auto;
}

.warning-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.warning-row:last-child {
  border-bottom: none;
}

.warning-text {
  flex: 1;
  min-width: 0;
  line-height: 1.5;
  color: var(--text-color);
}
</style>
