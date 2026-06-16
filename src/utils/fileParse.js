import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx-js-style'
import Tesseract from 'tesseract.js'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

const TESS_WASM_PARAM_WARN = /Parameter not found:/i

async function tesseractRecognizeQuiet(file) {
  const pass = (orig) => (...args) => {
    const msg = args.map((a) => (typeof a === 'string' ? a : String(a?.message ?? a))).join(' ')
    if (TESS_WASM_PARAM_WARN.test(msg)) return
    orig.apply(console, args)
  }
  const warn = console.warn
  const err = console.error
  console.warn = pass(warn)
  console.error = pass(err)
  try {
    return await Tesseract.recognize(file, 'chi_sim+eng', { logger: () => {} })
  } finally {
    console.warn = warn
    console.error = err
  }
}

function detectFileType(file) {
  const name = String(file?.name || '')
  const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : ''
  const mime = String(file?.type || '')

  if (mime.startsWith('text/') || ['txt', 'md', 'json', 'csv', 'log'].includes(ext)) {
    return 'text'
  }
  if (mime === 'application/pdf' || ext === 'pdf') {
    return 'pdf'
  }
  if (
    ext === 'docx' ||
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return 'word'
  }
  if (
    ['xls', 'xlsx', 'xlsm', 'csv'].includes(ext) ||
    mime.includes('spreadsheet') ||
    mime === 'text/csv'
  ) {
    return 'excel'
  }
  if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(ext)) {
    return 'image'
  }
  return null
}

const extractByType = {
  async text(file) {
    const content = await file.text()
    return { content, meta: {} }
  },
  async pdf(file) {
    const buf = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise
    const pages = []
    const pageTexts = []
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const tc = await page.getTextContent()
      pages.push(tc)
      pageTexts.push(tc.items.map((it) => ('str' in it ? it.str : '')).join(''))
    }    
    return {
      content: pageTexts.join(''),
      meta: { numPages: pdf.numPages, pages }
    }
  },
  async word(file) {
    const r = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
    return {
      content: r.value ?? '',
      meta: { messages: r.messages ?? [] }
    }
  },
  async excel(file) {
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' })
    const sheets = wb.SheetNames.map((name) => {
      const sheet = wb.Sheets[name]
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
      return { name, rows }
    })
    return {
      content: sheets,
      meta: { sheetNames: [...wb.SheetNames] }
    }
  },
  async image(file) {
    const recognize = await tesseractRecognizeQuiet(file)
    return {
      content: recognize?.data?.text ?? '',
      meta: { recognize }
    }
  }
}

export async function extractFileText(file) {
  const fileType = detectFileType(file)
  if (!fileType) {
    const name = String(file?.name || '')
    throw new Error(
      `不支持的文件类型：${name || '未知'}。请使用 PDF、图片、Excel、Word(docx) 或文本。`
    )
  }
  const { content, meta } = await extractByType[fileType](file)
  return {
    fileName: String(file?.name || ''),
    fileType,
    content,
    meta
  }
}

export function flattenExtractData({ fileType, content }) {
  switch (fileType) {
    case 'text':
    case 'word':
    case 'image':
    case 'pdf':
      return String(content ?? '')
    case 'excel': {
      if (!Array.isArray(content) || !content.length) return ''
      return content
        .map(({ rows }) =>
          (rows ?? []).map((row) => (Array.isArray(row) ? row.join('\t') : String(row))).join('\n')
        )
        .join('\n')
    }
    default:
      return ''
  }
}
