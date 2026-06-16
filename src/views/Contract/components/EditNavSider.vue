<template>
  <div ref="rootRef" class="edit-nav-sider" @click.capture="onAnchorLinkClickCapture">
    <a-anchor :affix="false" :items="anchorItems" :get-container="anchorGetContainer" :offset-top="anchorOffsetTop"
      :bounds="8" wrapper-class="edit-nav-anchor__wrap" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

defineOptions({ name: 'EditNavSider' })

const navList = [
  { key: 'doc', label: '附件信息' },
  { key: 'base', label: '基础信息' },
  {
    key: 'business',
    label: '业务信息',
    children: [{ key: 'related', label: '关联合同' }],
  },
  {
    key: 'finance',
    label: '财务信息',
    children: [
      { key: 'payment', label: '收付计划' },
      { key: 'budget', label: '预算分摊' },
    ],
  },
  { key: 'supplement', label: '补充条款' },
  { key: 'breach', label: '违约条款' },
]

const rootRef = ref(null)

/** 与编辑区 `id="section-${key}"` 一致 */
const anchorItems = computed(() =>
  navList.map((node) => {
    const item = {
      key: node.key,
      href: `#section-${node.key}`,
      title: node.label,
    }
    if (node.children?.length) {
      return {
        ...item,
        children: node.children.map((ch) => ({
          key: ch.key,
          href: `#section-${ch.key}`,
          title: ch.label,
        })),
      }
    }
    return item
  }),
)

/**
 * 滚动容器为 `.contract-layout__view` 时，顶栏/标签栏不在该容器内，不宜再用整页 80px。
 * 与 `bounds` 配合，表示视口内判定「当前段落」的顶部留白（px）。
 */
const anchorOffsetTop = 200

function getScrollParent(el) {
  let p = el?.parentElement
  while (p) {
    const { overflowY } = getComputedStyle(p)
    // 不设 scrollHeight > clientHeight：首屏布局未完成时会误判，Anchor 监听到 document 而实际滚动在布局容器上
    if (/(auto|scroll|overlay)/.test(overflowY)) {
      return p
    }
    p = p.parentElement
  }
  return typeof document !== 'undefined'
    ? document.documentElement
    : null
}

function anchorGetContainer() {
  const root = rootRef.value
  /** 与 Layout 主内容区一致，保证与真实滚动条、锚点高亮同一容器 */
  const layoutView = root?.closest?.('.contract-layout__view')
  if (layoutView) return layoutView
  const el = getScrollParent(root)
  return el || (typeof document !== 'undefined' ? document.documentElement : null)
}

/** 不用路由：`href` 只是 `#id` 给 Anchor 解析；阻止默认行为可避免地址栏出现 hash（滚动仍由组件内 scrollTo 完成） */
function onAnchorLinkClickCapture(e) {
  const a = e.target?.closest?.('a.ant-anchor-link-title')
  if (!a) return
  const href = a.getAttribute('href') || ''
  if (href.startsWith('#') && href.length > 1) {
    e.preventDefault()
  }
}
</script>

<style scoped lang="scss">
.edit-nav-sider {
  width: 100px;
  flex-shrink: 0;
  align-self: flex-start;
  position: sticky;
  top: 16px;
  background: #fff;
  height: fit-content;
  font-size: 12px;

  :deep(.ant-anchor) {
    font-size: 12px;
    padding: 2px 0;

    .ant-anchor-ink {
      width: 1px;
      transition: none !important;
    }

    .ant-anchor-link-title {
      font-weight: 400 !important;
      transition: none !important;
      -webkit-tap-highlight-color: transparent;
    }

    .ant-anchor-link-title.ant-anchor-link-title-active {
      font-weight: 600 !important;
    }

    .ant-anchor-link {
      padding-block: 2px;
    }
  }
}
</style>
