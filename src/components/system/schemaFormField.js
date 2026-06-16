/** SchemaForm 单字段：选项与详情展示（存取均为 label，与 DingTemplateRenderer 一致） */

/** 表单绑定字段名：静态 schema 用 fieldName，钉钉模板项可用 _key */
export function schemaFormBindingKey(comp) {
  return comp?.props?.fieldName ?? comp?.props?._key ?? ''
}

/** 选项归一化为 { label, value }，value 与 label 相同 */
export function normalizeSchemaOptions(options) {
  if (!Array.isArray(options)) return []
  const seen = new Set()
  const out = []
  for (const o of options) {
    let label = ''
    if (typeof o === 'string') {
      try {
        const p = JSON.parse(o)
        label = p.value != null ? String(p.value).trim() : String(p.label ?? '').trim()
      } catch {
        label = o.trim()
      }
    } else if (o != null && typeof o === 'object') {
      label = String(o.label ?? o.value ?? '').trim()
    } else if (o != null) {
      label = String(o).trim()
    }
    if (!label || seen.has(label)) continue
    seen.add(label)
    out.push({ label, value: label })
  }
  return out
}

/** 取组件类型（componentType 或 componentName） */
function resolvedSchemaComponentType(comp) {
  return comp?.componentType || comp?.componentName || ''
}

/** 日期 format 转 dayjs 大写 Y（如 yyyy → YYYY） */
export function schemaDatePickerDisplayFormat(fmt) {
  if (!fmt || typeof fmt !== 'string') return 'YYYY-MM-DD'
  return fmt.replace(/y/g, 'Y')
}

/** formState 存值 → 详情展示文案 */
function formatStoredValue(val) {
  if (val == null) return ''
  if (Array.isArray(val)) return val.filter((v) => v != null && v !== '').join('、')
  return String(val)
}

/** 详情模式：直接展示 formState 中的值（不再反查 options） */
export function formatSchemaFieldDetail(comp, formState) {
  const key = schemaFormBindingKey(comp)
  if (!key || !formState) return ''
  const val = formState[key]
  const type = resolvedSchemaComponentType(comp)

  if (type === 'RangeDateField') {
    if (!Array.isArray(val)) return String(val ?? '')
    return val.filter(Boolean).join(' ~ ')
  }
  return formatStoredValue(val)
}
