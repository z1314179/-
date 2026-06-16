<template>
  <a-modal
    :open="open"
    :title="title"
    :footer="null"
    width="560px"
    destroy-on-close
    @update:open="onUpdateOpen"
  >
    <div class="notice-more">
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="tab-item"
          :class="{ 'tab-item--active': activeKey === tab.key }"
          @click="activeKey = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>
      <div class="list-wrap">
        <div v-for="item in filteredItems" :key="item.id" class="list-row">
          <span class="row-text">{{ item.content }}</span>
          <a-button type="primary" size="small" class="confirm-pill" @click="onConfirm(item)">
            确认
          </a-button>
        </div>
        <div v-if="!filteredItems.length" class="list-empty">暂无数据</div>
      </div>
    </div>
  </a-modal>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

defineOptions({ name: 'NoticeMoreModal' })

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '通知' },
  /** 与首页 NoticePanel 一致：{ id, content, read? } */
  items: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:open', 'confirm'])

const tabs = [
  { key: 'unread', label: '未读' },
  { key: 'read', label: '已读' },
  { key: 'all', label: '全部' },
]

const activeKey = ref('unread')

watch(
  () => props.open,
  (v) => {
    if (v) activeKey.value = 'unread'
  },
)

const filteredItems = computed(() => {
  const list = props.items || []
  if (activeKey.value === 'all') return list
  if (activeKey.value === 'read') return list.filter((row) => row.read === true)
  return list.filter((row) => !row.read)
})

const onUpdateOpen = (v) => emit('update:open', v)

const onConfirm = (item) => {
  emit('confirm', item.id)
}
</script>

<style scoped lang="scss">
.notice-more {
  margin-top: -8px;
}

.tabs {
  display: flex;
  gap: 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  margin-bottom: 0;
}

.tab-item {
  position: relative;
  padding: 10px 0 12px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.65);
}

.tab-item--active {
  color: var(--color-primary);
  font-weight: 500;
}

.tab-item--active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  background: var(--color-primary);
}

.list-wrap {
  max-height: 420px;
  overflow: auto;
  padding-top: 8px;
}

.list-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.row-text {
  flex: 1;
  min-width: 0;
  line-height: 1.5;
  font-size: 14px;
  color: var(--text-color);
}

.confirm-pill {
  flex-shrink: 0;
  border-radius: 999px;
  padding: 0 14px;
  height: 26px;
  line-height: 24px;
  font-size: 12px;
}

.list-empty {
  padding: 24px 0;
  text-align: center;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
}
</style>
