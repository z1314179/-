/** 钉钉选项统一为中文 label 作 value，按名称去重 */
export function parseDingSelectOptions(options) {
  if (!Array.isArray(options)) return []
  const seen = new Set()
  const list = []
  for (const option of options) {
    let label = ''
    if (typeof option === 'string') {
      try {
        const obj = JSON.parse(option)
        label = obj.value != null ? String(obj.value).trim() : ''
      } catch {
        continue
      }
    } else {
      label = option?.label != null ? String(option.label).trim() : ''
    }
    if (!label || seen.has(label)) continue
    seen.add(label)
    list.push({ label, value: label })
  }
  return list
}

export function resolveDingSelectDisplayValue(storedValue) {
  if (storedValue === undefined || storedValue === null || storedValue === '') {
    return storedValue === 0 || storedValue === false ? storedValue : ''
  }
  if (Array.isArray(storedValue)) return storedValue.join('、')
  return storedValue
}
