// PDF 水印 Hook：读取 PDF、绘制平铺水印并导出下载文件。
import { ref } from 'vue'
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib'

/**
 * @param {string|Blob|File|ArrayBuffer|Uint8Array} input
 * @returns {Promise<Uint8Array>}
 */
async function readPdfBytes(input) {
  if (input instanceof Uint8Array) return input
  if (input instanceof ArrayBuffer) return new Uint8Array(input)
  if (input instanceof Blob) return new Uint8Array(await input.arrayBuffer())
  if (typeof File !== 'undefined' && input instanceof File) {
    return new Uint8Array(await input.arrayBuffer())
  }
  if (typeof input === 'string') {
    const res = await fetch(input)
    if (!res.ok) throw new Error(`无法下载 PDF：HTTP ${res.status}`)
    return new Uint8Array(await res.arrayBuffer())
  }
  throw new Error('不支持的 PDF 来源（请使用 URL 字符串、Blob、File、ArrayBuffer 或 Uint8Array）')
}

/**
 * @typedef {object} PdfWatermarkDrawOptions
 * @property {string} [text] 水印文字
 * @property {number} [opacity] 0~1
 * @property {number} [rotation] 旋转角度（度）
 * @property {number} [tileCols] 一行铺几个（列数），整页等分宽度
 * @property {number} [tileRows] 一列铺几行（行数），整页等分高度
 * @property {{ r: number, g: number, b: number }} [color] 0~1
 * @property {Uint8Array|ArrayBuffer} [fontBytes] 自定义 TTF/OTF
 */

/**
 * 在 PDF 每页按「列数 × 行数」铺满平铺。
 * 以 CropBox（正文区域）为基准；仅垂直方向外扩约「半格」贴顶底，横向不外扩，避免水印画出裁剪区被阅读器左右裁切。
 */
export async function addWatermarkToPdfBytes(pdfInput, options = {}) {
  const {
    text = 'CONFIDENTIAL',
    opacity = 0.14,
    rotation: rotationOpt = -38,
    tileCols: tileColsOpt = 4,
    tileRows: tileRowsOpt = 5,
    color = { r: 0.72, g: 0.72, b: 0.72 }
  } = options

  const rotationDeg = Number.isFinite(Number(rotationOpt)) ? Number(rotationOpt) : -38

  const fontBytes = options.fontBytes
    ? options.fontBytes instanceof Uint8Array
      ? options.fontBytes
      : new Uint8Array(options.fontBytes)
    : null

  const bytes = await readPdfBytes(pdfInput)
  const pdfDoc = await PDFDocument.load(bytes, {
    ignoreEncryption: true,
    updateMetadata: false
  })

  let font
  if (fontBytes && fontBytes.byteLength > 0) {
    font = await pdfDoc.embedFont(fontBytes, { subset: true })
  } else {
    font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  }

  const fill = rgb(color.r, color.g, color.b)
  const drawOpacity = Math.min(0.55, Math.max(0.05, opacity))
  const pages = pdfDoc.getPages()

  const tileOpacity = Math.min(0.38, drawOpacity * 0.92)
  const maxGrid = 48

  for (const page of pages) {
    const crop = page.getCropBox()
    const bx = crop.x
    const by = crop.y
    const width = crop.width
    const height = crop.height

    const cols = Math.max(1, Math.min(maxGrid, Math.round(Number(tileColsOpt)) || 4))
    const rows = Math.max(1, Math.min(maxGrid, Math.round(Number(tileRowsOpt)) || 5))

    /** 横向：严格落在 Crop 宽度内，避免左右被裁切；纵向：外扩半格，减轻顶/底留白 */
    const cellW0 = width / cols
    const cellH0 = height / rows
    const bx0 = bx
    const by0 = by - cellH0 / 2
    const cellW = cellW0
    const cellH = (height + cellH0) / rows

    /** 格内字号：略收紧边距，让字在格子里更饱满 */
    let tfs = Math.min(48, Math.max(cellW * 0.24, cellH * 0.18, 8))
    tfs = Math.min(tfs, cellH * 0.44)
    let ttw = font.widthOfTextAtSize(text, tfs)
    let guard = 0
    while (guard < 120 && tfs >= 6) {
      guard += 1
      ttw = font.widthOfTextAtSize(text, tfs)
      if (ttw <= cellW * 0.95 && tfs * 1.1 <= cellH * 0.95) break
      tfs -= 0.5
    }
    if (tfs < 6) {
      tfs = 6
      ttw = font.widthOfTextAtSize(text, tfs)
    }

    for (let c = 0; c < cols; c++) {
      for (let row = 0; row < rows; row++) {
        const px = bx0 + (c + 0.5) * cellW
        const py = by0 + (row + 0.5) * cellH
        const x = px - ttw / 2
        const y = py - tfs * 0.38
        page.drawText(text, {
          x,
          y,
          size: tfs,
          font,
          color: fill,
          opacity: tileOpacity,
          rotate: degrees(rotationDeg)
        })
      }
    }
  }

  const out = await pdfDoc.save()
  return out
}

function triggerDownload(uint8, filename) {
  const blob = new Blob([uint8], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || 'watermarked.pdf'
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }, 200)
}

/**
 * @param {object} [defaultOptions]
 */
export function usePdfWatermark(defaultOptions = {}) {
  const loading = ref(false)
  const lastError = ref(null)

  async function downloadWatermarkedPdf(pdfInput, options = {}) {
    const merged = { ...defaultOptions, ...options }
    const { filename, ...drawOpts } = merged
    loading.value = true
    lastError.value = null
    try {
      const out = await addWatermarkToPdfBytes(pdfInput, drawOpts)
      triggerDownload(out, filename || 'watermarked.pdf')
    } catch (e) {
      lastError.value = e instanceof Error ? e : new Error(String(e))
      throw lastError.value
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    lastError,
    downloadWatermarkedPdf,
    getWatermarkedPdfBytes: addWatermarkToPdfBytes
  }
}
