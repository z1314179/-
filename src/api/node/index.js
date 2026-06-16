import request from '@/http/index'

export function getPdfHtml(data) {
  return request({
    url: '/nodeApi/api/html',
    method: 'post',
    responseType: 'blob',
    errorNone: true,
    data
  })
}

// form-data
export function ocrpdfScan(data) {
  return request({
    url: '/nodeApi/api/ocr/pdf-scan',
    method: 'post',
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    data: data
  })
}
export function ocrimage(data) {
  return request({
    url: '/nodeApi/api/ocr/image',
    method: 'post',
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    data: data
  })
}

async function parsePdfBlob(blob) {
  if (!(blob instanceof Blob)) {
    if (blob?.error) throw new Error(blob.error)
    throw new Error('PDF 生成失败')
  }
  if (blob.size < 5) {
    throw new Error('PDF 生成结果为空')
  }
  if (blob.type?.includes('json')) {
    const json = JSON.parse(await blob.text())
    throw new Error(json.error || 'PDF 生成失败')
  }
  const head = new Uint8Array(await blob.slice(0, 5).arrayBuffer())
  const sig = String.fromCharCode(...head)
  if (sig !== '%PDF-') {
    throw new Error('PDF 生成失败（响应不是有效 PDF）')
  }
  return blob
}

/** 文件转 PDF，返回 Blob */
export async function fileToPdf(data) {
  // 不要手动设 Content-Type，否则缺少 boundary，后端收不到 file
  const blob = await request({
    url: '/nodeApi/api/file/to-pdf',
    method: 'post',
    errorNone: true,
    responseType: 'blob',
    data
  })
  return parsePdfBlob(blob)
}
// export async function fileUrlToPdf(data) {
//   return request({
//     url: '/nodeApi/api/file/to-pdf-url',
//     method: 'post',
//     data
//   })
// }
export async function fileUrlToPdf(data) {
  return request({
    url: '/api/open/forward',
    method: 'post',
    data
  })
}
