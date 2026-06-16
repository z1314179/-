// 文件比对：传入两份文件，返回对比结果对象。
import { callDeepSeekChat } from '@/utils/AI/deepseek.js'
import { extractFileText, flattenExtractData } from '@/utils/fileParse.js'
import { isJSON } from '@/utils/com.js'
import { getFileBlob, uploadPath } from '@/utils/preview.js'
const EMPTY_EXTRACT_MSG = '未能从文件中提取到有效内容'

function buildComparePrompt(content1, content2, name1, name2) {
  return `请严格对比以下两份「已从文件中提取的纯文本」，判断它们的「有效信息」是否相同。

【文件1：${name1}】
${content1}

【文件2：${name2}】
${content2}
【对比规则（必须严格执行）】
1. 对比前，先对两份文本做「归一化」处理：
   - 删除所有空格（包括半角空格、全角空格、制表符\t）
   - 删除所有换行符（\n、\r）
   - 删除首尾空白
2. 归一化后的字符串：
   - 完全相同 → 输出：{"type": "same"}
   - 不完全相同 → 输出：{"type": "different"} 并列出差异
3. 严禁因为以下原因输出 different：
   - 空格数量不同
   - 换行位置不同
   - 缩进不同
   - 字段对齐方式不同
   - 视觉或排版上的差异
4. 只有以下情况才算 different：
   - 字母/数字/汉字不同
   - 标点符号不同（包括中英文标点差异）
   - 大小写不同
   - 货币符号不同（¥ vs $）
   - 单位符号不同（% vs ‰）

【输出格式】
只输出 JSON，不要输出任何解释、说明或额外文本。
示例1（相同）：
{"type": "same"}
示例2（不同）：
{"type": "different", "differences": [{"field": "金额", "file1_value": "1000", "file2_value": "2000", "reason": "数值不同"}]}
示例3（文件信息没有可以对比的有效信息/只有空格/信息内容完全不同）：
{"type": "differentAll"}
`
}

function extractJsonFromRaw(raw) {
  if (raw == null || raw === '') return null
  const text = String(raw).trim()
  if (isJSON(text)) return JSON.parse(text)
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (codeBlock && isJSON(codeBlock[1].trim())) return JSON.parse(codeBlock[1].trim())
  const brace = text.match(/\{[\s\S]*\}/)
  if (brace && isJSON(brace[0])) return JSON.parse(brace[0])
  return null
}

function parseCompareResult(raw) {
  const data = extractJsonFromRaw(raw)
  if (!data || typeof data !== 'object') {
    throw new Error('无法解析对比结果')
  }
  if (!['same', 'different', 'differentAll'].includes(data.type)) {
    throw new Error('对比结果格式异常')
  }
  return data
}

function nameFromUrl(url) {
  const path = uploadPath(url) || String(url)
  const segment = path.split('/').pop() || 'file'
  try {
    return decodeURIComponent(segment.replace(/^name:/, ''))
  } catch {
    return segment
  }
}

async function resolveCompareFile(file, url, name) {
  if (file instanceof File) return file
  const src = url ?? file
  if (!src) return null
  if (src instanceof Blob) {
    return new File([src], name || 'file', { type: src.type || 'application/octet-stream' })
  }
  const blob = await getFileBlob(src)
  return new File([blob], name || nameFromUrl(src), { type: blob.type || 'application/octet-stream' })
}

async function extractTextFromFile(file) {
  const { fileType, content } = await extractFileText(file)
  const text = flattenExtractData({ fileType, content })
  if (!text.length) {
    throw new Error(EMPTY_EXTRACT_MSG)
  }
  return { name: file.name, content: text }
}

export function useFileCompare() {
  /**
   * @param {File} file1
   * @param {File} file2
   * @returns {Promise<{ type: 'same'|'different'|'differentAll', differences?: Array }>}
   */
  async function compareFiles({ file1, file2, url1, url2, name1, name2 } = {}) {
    const [f1, f2] = await Promise.all([
      resolveCompareFile(file1, url1, name1),
      resolveCompareFile(file2, url2, name2)
    ])
    if (!f1 || !f2) {
      throw new Error('请传入两个文件')
    }

    const [info1, info2] = await Promise.all([
      extractTextFromFile(f1),
      extractTextFromFile(f2)
    ])

    const prompt = buildComparePrompt(
      info1.content,
      info2.content,
      info1.name,
      info2.name
    )

    const raw = await callDeepSeekChat({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 4096,
      systemPrompt: '你是一个严谨的数据对比助手，只返回用户要求的结果格式，不要添加额外解释。'
    })

    return parseCompareResult(raw)
  }

  return { compareFiles }
}
