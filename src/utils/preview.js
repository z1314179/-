import { api as viewerApi } from "v-viewer";
import FileSaver from 'file-saver'
import { fileToPdf, fileUrlToPdf } from '@/api/node/index.js'
import userStore from '@/store/user.js'

/** @returns 七牛路径字符串；兼容 hook uploadFile 返回的 { data, name, size, type } */
export const uploadPath = (urlOrPayload) => {
  if (urlOrPayload != null && typeof urlOrPayload === 'object' && urlOrPayload.data != null) {
    return urlOrPayload.data
  }
  return urlOrPayload
}

export const getUrl = (url) => {
  const path = uploadPath(url)
  if (!path) return "";
  if (!path.startsWith("http")) {
    return process.env.IMG + path;
  }
  return path;
}
export const previewImg = (urls, index = 0) => {
  let arr = []
  if (Array.isArray(urls)) {
    arr = urls.map(e => {
      return getUrl(e)
    })
  } else {
    arr = [getUrl(urls)]
  }
  viewerApi({
    images: arr,
    options: {
      initialViewIndex: index,
      inline: false,
      button: true,
      navbar: true,
      title: false,
      toolbar: true,
      tooltip: true,
      movable: true,
      zoomable: true,
      rotatable: true,
      scalable: true,
      transition: true,
      fullscreen: true,
      keyboard: true,
    }
  });
}
export const previewPdf = (urls) => {
  window.open(getUrl(urls), "_blank")
}
export const previewFile = (urls) => {
  if (!urls) return
  if (![".gif", ".jpg", ".jpeg", ".png", ".gif", ".jpg", ".png", ".pdf"].includes(fileType(urls))) return '无法预览'
  if (
    [".gif", ".jpg", ".jpeg", ".png", ".gif", ".jpg", ".png"].includes(
      fileType(urls)
    )
  ) {
    previewImg(urls);
  } else {
    previewPdf(urls);
  }
}
export const fileType = (file) => {
  if (!file) return false;
  if (typeof file === 'object' && file?.name) {
    const n = String(file.name)
    const pos = n.lastIndexOf('.')
    if (pos > 0) return n.substring(pos, n.length)
  }
  if (typeof file === 'object' && file?.data) {
    return fileType(file.data)
  }
  let fileName = file
  let pos = fileName.lastIndexOf(".");
  if (pos > 0) {
    let lastName = fileName.substring(pos, fileName.length);
    return lastName;
  } else {
    return false;
  }
}
export const fileNames = (fileName) => {
  if (!fileName) return [];
  if (typeof fileName === 'object' && fileName != null) {
    if (fileName.name) {
      const n = String(fileName.name)
      const pos = n.lastIndexOf('.')
      if (pos > 0) return [n.slice(0, pos), n.slice(pos)]
      return [n, '']
    }
    if (fileName.data != null) return fileNames(fileName.data)
    return []
  }
  try {
    let filepos = fileName.lastIndexOf("/")
    let file = fileName.substring(filepos + 1)
    let arr = file.split("name:")
    let str = file
    if (arr.length == 2) {
      str = arr[1]
    }
    let pos = str.lastIndexOf("."); 
    if (pos > 0) {
      arr[0] = str.substring(0, pos)
      arr[1] = str.substring(pos)
    } else {
      arr[0] = str 
      arr[1] = ''
    }
    return arr
  } catch (error) {
    return []
  }
}
export const downloadFile = (file) => {
  let url = getUrl(file)
  fetch(url)
    // 获取 blob 对象
    .then(res => res.blob())
    .then(blob => {
      const names = fileNames(file)
      const name = names.length > 1 ? names.join('') : (names[0] || 'download')
      downLoadObj(blob, name)
    })
}
export function downLoadObj(blob, name) {
  if (!blob?.size) {
    throw new Error('文件为空，无法下载')
  }
  const link = document.createElement('a')
  link.style.display = 'none'
  document.body.appendChild(link)
  const url = window.URL.createObjectURL(blob)
  link.href = url
  link.download = name
  link.click()
  // 立即 revoke 会导致部分浏览器下载到空白 PDF
  setTimeout(() => {
    window.URL.revokeObjectURL(url)
    document.body.removeChild(link)
  }, 200)
}

/** 打包项转 { name, blob }：支持 url、File/Blob、base64 */
export async function resolvePackItem(item) {
  if (item instanceof Blob) {
    return {
      name: item instanceof File ? item.name : 'file',
      blob: item,
    }
  }
  if (item != null && typeof item === 'object' && item.base64 != null) {
    const name = item.name || 'file'
    const blob = base64ToFile(item.base64, name, item.mimeType || 'application/octet-stream')
    return { name: blob.name, blob }
  }
  if (typeof item === 'string' && item.startsWith('data:')) {
    const comma = item.indexOf(',')
    const header = item.slice(0, comma)
    const base64 = item.slice(comma + 1)
    const mimeType = header.match(/data:([^;]+)/)?.[1] || 'application/octet-stream'
    const blob = base64ToFile(base64, 'file', mimeType)
    return { name: blob.name, blob }
  }
  const name = fileNames(item).join('') || 'file'
  const blob = await getFileBlob(uploadPath(item))
  return { name, blob }
}

/** 将已解析的文件列表打成 zip 并下载 */
export async function packDownload(items, packName) {
  if (!items?.length) return
  const { default: JSZip } = await import('jszip')
  const resolved = await Promise.all(items.map(resolvePackItem))
  const zip = new JSZip()
  const cache = {}
  let index = 0
  for (const item of resolved) {
    let _name = ''
    if (cache[item.name]) {
      index += 1
      item.name.lastIndexOf('.')
      let names = item.name.split('.')
      names[names.length - 1] = '(' +
        index +
        ').' + names[names.length - 1]
      _name = names.join('')
      cache[_name] = item.blob
    } else {
      index = 0
      _name = item.name
      cache[_name] = item.blob
    }
    zip.file(_name, item.blob, {
      binary: true
    })
  }
  const content = await zip.generateAsync({
    type: 'blob'
  })
  FileSaver.saveAs(content, packName || '文件包')
}

export const downloadPack = async (urls, packNmae) => {  
  if (!urls?.length) return
  const items = await Promise.all(urls)
  if (items.length === 1) {
    const { name, blob } = await resolvePackItem(items[0])
    downLoadObj(blob, name)
    return
  }
  return packDownload(items, packNmae)
}

export function getFileBlob(e) {
  const url = getUrl(e)
  return new Promise((resolve, reject) => {
    const xmlhttp = new XMLHttpRequest()
    xmlhttp.open('GET', url, true)
    xmlhttp.responseType = 'blob'
    xmlhttp.timeout = 60 * 5 * 1000
    xmlhttp.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        resolve(this.response)
      } else {
        reject(new Error(`附件下载失败 HTTP ${this.status}`))
      }
    }
    xmlhttp.onerror = () => reject(new Error('附件下载失败，请检查网络'))
    xmlhttp.ontimeout = () => reject(new Error('附件下载超时，请稍后重试'))
    xmlhttp.onabort = () => reject(new Error('附件下载已取消'))
    xmlhttp.send()
  })
}

/** base64 字符串转 File，供 uploadFile 等使用 */
export function base64ToFile(base64, filename = 'file', mimeType = 'application/octet-stream') {
  const pure = String(base64 ?? '').includes(',')
    ? String(base64).split(',')[1]
    : String(base64 ?? '')
  const binary = atob(pure)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new File([bytes], filename, { type: mimeType })
}

/** url / file 转 File；单个返回 File，多个返回 File[] */
export async function resolveSourceFiles({ file, url } = {}) {
  if (url != null) {
    const urls = Array.isArray(url) ? url : [url]
    const files = await Promise.all(urls.map(async (u) => {
      const blob = await getFileBlob(u)
      const names = fileNames(u)
      const name = names.length > 1 ? names.join('') : (names[0] || 'file')
      return new File([blob], name, { type: blob.type || 'application/octet-stream' })
    }))
    return files.length === 1 ? files[0] : files
  }
  if (file != null) {
    const list = Array.isArray(file) ? file : [file]
    const files = list.map((f) => f?.originFileObj || f).filter(Boolean)
    if (!files.length) throw new Error('文件不存在')
    return files.length === 1 ? files[0] : files
  }
  throw new Error('文件不存在')
}

async function toWatermarkPdfFile(rawFile, options = {}) {
  if (!rawFile?.size) {
    throw new Error('附件为空，无法生成 PDF')
  }
  const form = new FormData()
  form.append('file', rawFile, rawFile.name || 'document')
  form.append('watermark', options.watermark || '合同借阅')
  const pdfBlob = await fileToPdf(form)
  const pdfName = options.filename ?? rawFile.name.replace(/\.[^.]+$/, '') + '.pdf'
  return new File([pdfBlob], pdfName, { type: 'application/pdf' })
}

/** 文件转带水印 PDF；单个返回 File，多个返回 File[]，不触发下载 */
export async function toWatermarkPdf({ file, url } = {}, options = {}) {
  const resolved = await resolveSourceFiles({ file, url })
  if (Array.isArray(resolved)) {
    return Promise.all(resolved.map((f) => toWatermarkPdfFile(f, options)))
  }
  return toWatermarkPdfFile(resolved, options)
}

// fileUrlToPdf
export async function toWatermarkFileUrlToPdf(obj, options = {}) {
  const res = await fileUrlToPdf({
    ...obj
  })
  if (res.errno === 0) {
    return res.data
  }
  throw new Error(res.message)
}