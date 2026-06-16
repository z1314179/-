<template>
  <div class="pdf-preview">
    <div v-if="title" class="pdf-preview__head">{{ title }}</div>

    <div v-if="hasSource" class="pdf-preview__toolbar">
      <a-space wrap :size="8">
        <a-button size="small" :disabled="currentPage <= 1 || loading" @click="goPrev">上一页</a-button>
        <a-button size="small" :disabled="currentPage >= totalPages || loading" @click="goNext">
          下一页
        </a-button>
        <span class="pdf-preview__page-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
        <a-input-number
          v-model:value="jumpInput"
          :min="1"
          :max="Math.max(1, totalPages)"
          size="small"
          :controls="false"
          style="width: 72px"
          @press-enter="applyJump"
        />
        <a-button size="small" :disabled="loading" @click="applyJump">跳转</a-button>
        <a-divider type="vertical" />
        <a-button size="small" :disabled="loading" @click="zoomOut">缩小</a-button>
        <a-button size="small" :disabled="loading" @click="zoomIn">放大</a-button>
        <a-button size="small" :disabled="loading" @click="setFitWidth">适合宽度</a-button>
        <a-divider type="vertical" />
        <a-button v-if="showDownload && downloadable" size="small" type="link" @click="onDownload">
          下载
        </a-button>
        <a-button size="small" :disabled="loading" @click="reload">重新加载</a-button>
      </a-space>
    </div>

    <div ref="bodyRef" class="pdf-preview__body" :style="{ minHeight: minBodyHeight }">
      <a-spin :spinning="loading" tip="加载 PDF 中…">
        <a-empty v-if="!hasSource && !loading" :description="emptyText" />
        <div v-else class="pdf-preview__scroll">
          <canvas ref="canvasRef" class="pdf-preview__canvas" />
        </div>
      </a-spin>
    </div>

    <a-alert v-if="errorMsg" type="error" :message="errorMsg" show-icon class="pdf-preview__alert" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

defineOptions({ name: 'PdfPreview' })

const props = defineProps({
  /** 远程 PDF 地址（与 file 二选一） */
  src: {
    type: String,
    default: '',
  },
  /** 本地 File / Blob（与 src 二选一） */
  file: {
    type: Object,
    default: null,
    validator: (v) => v == null || (typeof Blob !== 'undefined' && v instanceof Blob),
  },
  /** 传入 getDocument 的额外参数，如 withCredentials、httpHeaders */
  documentInit: {
    type: Object,
    default: () => ({}),
  },
  /** 顶部标题，不需要可留空 */
  title: {
    type: String,
    default: '',
  },
  /** 预览区域最小高度 */
  minBodyHeight: {
    type: String,
    default: '520px',
  },
  /** 初始缩放：1 为 100% */
  initialScale: {
    type: Number,
    default: 1.15,
  },
  /** 无地址且无文件时的空状态文案 */
  emptyText: {
    type: String,
    default: '请传入 PDF 链接（src）或文件（file）',
  },
  /** 是否显示下载按钮（需存在可下载的 src 或由 file 生成临时链） */
  showDownload: {
    type: Boolean,
    default: true,
  },
  /** 使用 file 时下载的默认文件名 */
  downloadName: {
    type: String,
    default: 'document.pdf',
  },
})

const emit = defineEmits(['loaded', 'error'])

const bodyRef = ref(null)
const canvasRef = ref(null)
const loading = ref(false)
const errorMsg = ref('')
const totalPages = ref(0)
const currentPage = ref(1)
const jumpInput = ref(1)
const displayScale = ref(props.initialScale)
const fitWidthActive = ref(false)

let pdfDoc = null
let loadingTask = null

const hasSource = computed(() => !!(props.src || props.file))

const downloadable = computed(() => !!(props.src || props.file))

async function buildLoadingTask() {
  const extra = { ...props.documentInit }
  if (props.file) {
    const buf = await props.file.arrayBuffer()
    return pdfjsLib.getDocument({ data: new Uint8Array(buf), ...extra })
  }
  if (props.src) {
    return pdfjsLib.getDocument({ url: props.src, ...extra })
  }
  return null
}

function teardownDoc() {
  try {
    loadingTask?.destroy?.()
  } catch (_) {
    /* noop */
  }
  loadingTask = null
  pdfDoc = null
}

async function renderCurrentPage() {
  if (!pdfDoc || !canvasRef.value || !bodyRef.value) return
  const pageNum = currentPage.value
  const page = await pdfDoc.getPage(pageNum)
  const base = page.getViewport({ scale: 1 })
  let scale = displayScale.value
  if (fitWidthActive.value) {
    const w = Math.max(320, bodyRef.value.clientWidth - 32)
    scale = w / base.width
  }
  const viewport = page.getViewport({ scale })
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const outputScale = window.devicePixelRatio || 1
  canvas.width = Math.floor(viewport.width * outputScale)
  canvas.height = Math.floor(viewport.height * outputScale)
  canvas.style.width = `${Math.floor(viewport.width)}px`
  canvas.style.height = `${Math.floor(viewport.height)}px`

  const transform =
    outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null

  await page.render({
    canvasContext: ctx,
    viewport,
    ...(transform ? { transform } : {}),
  }).promise
}

async function openPdf() {
  errorMsg.value = ''
  if (!hasSource.value) {
    teardownDoc()
    totalPages.value = 0
    currentPage.value = 1
    jumpInput.value = 1
    return
  }

  loading.value = true
  teardownDoc()

  try {
    loadingTask = await buildLoadingTask()
    if (!loadingTask) {
      loading.value = false
      return
    }
    pdfDoc = await loadingTask.promise
    totalPages.value = pdfDoc.numPages || 0
    currentPage.value = 1
    jumpInput.value = 1
    await nextTick()
    await renderCurrentPage()
    emit('loaded', { totalPages: totalPages.value })
  } catch (e) {
    const msg = e?.message || String(e)
    errorMsg.value = msg.includes('fetch') ? `加载失败（请检查地址是否可访问、跨域 CORS）: ${msg}` : msg
    emit('error', e)
  } finally {
    loading.value = false
  }
}

function goPrev() {
  if (currentPage.value <= 1) return
  currentPage.value -= 1
  jumpInput.value = currentPage.value
  queueRender()
}

function goNext() {
  if (currentPage.value >= totalPages.value) return
  currentPage.value += 1
  jumpInput.value = currentPage.value
  queueRender()
}

function applyJump() {
  const n = Math.min(Math.max(1, Math.floor(Number(jumpInput.value) || 1)), Math.max(1, totalPages.value))
  jumpInput.value = n
  currentPage.value = n
  queueRender()
}

let raf = 0
function queueRender() {
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(async () => {
    loading.value = true
    try {
      await renderCurrentPage()
    } catch (e) {
      errorMsg.value = e?.message || '渲染失败'
      emit('error', e)
    } finally {
      loading.value = false
    }
  })
}

function zoomIn() {
  fitWidthActive.value = false
  displayScale.value = Math.min(3, displayScale.value * 1.15)
  queueRender()
}

function zoomOut() {
  fitWidthActive.value = false
  displayScale.value = Math.max(0.35, displayScale.value / 1.15)
  queueRender()
}

function setFitWidth() {
  fitWidthActive.value = true
  queueRender()
}

function reload() {
  openPdf()
}

function onDownload() {
  if (props.src) {
    window.open(props.src, '_blank')
    return
  }
  if (props.file) {
    const url = URL.createObjectURL(props.file)
    const a = document.createElement('a')
    a.href = url
    a.download = props.file.name || props.downloadName
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1500)
  }
}

function onResize() {
  if (fitWidthActive.value && pdfDoc) queueRender()
}

watch(
  () => [props.src, props.file],
  () => {
    openPdf()
  },
)

watch(currentPage, (p) => {
  jumpInput.value = p
})

let resizeObserver = null

onMounted(() => {
  openPdf()
  window.addEventListener('resize', onResize)
  nextTick(() => {
    if (typeof ResizeObserver !== 'undefined' && bodyRef.value) {
      resizeObserver = new ResizeObserver(() => onResize())
      resizeObserver.observe(bodyRef.value)
    }
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  resizeObserver?.disconnect()
  resizeObserver = null
  cancelAnimationFrame(raf)
  teardownDoc()
})

defineExpose({
  reload,
  /** @param {number} page 1-based */
  async goToPage(page) {
    const n = Math.min(Math.max(1, page), Math.max(1, totalPages.value))
    currentPage.value = n
    jumpInput.value = n
    await nextTick()
    queueRender()
  },
})
</script>

<style lang="scss" scoped>
.pdf-preview {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  overflow: hidden;
}

.pdf-preview__head {
  padding: 12px 16px;
  font-weight: 600;
  font-size: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.pdf-preview__toolbar {
  padding: 10px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.pdf-preview__page-info {
  color: rgba(0, 0, 0, 0.65);
  font-size: 13px;
}

.pdf-preview__body {
  padding: 16px;
  background: #525659;
}

.pdf-preview__scroll {
  overflow: auto;
  text-align: center;
  max-height: min(72vh, 900px);
}

.pdf-preview__canvas {
  display: inline-block;
  vertical-align: top;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.35);
  background: #fff;
}

.pdf-preview__alert {
  margin: 0;
  border-radius: 0;
}
</style>
