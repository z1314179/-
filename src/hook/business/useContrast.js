
import { ref, computed } from 'vue'
import { isJSON } from '@/utils/com'

/** 前后数据差异对比 */
export default function useContrast() {
  let copyObjStr = ''
  const copyObj = ref(null)
  const filterNames = {}

  const alignObjKeys = (oldObj, newObj, fill = '') => {
    const o = oldObj && typeof oldObj === 'object' && !Array.isArray(oldObj) ? oldObj : {}
    const n = newObj && typeof newObj === 'object' && !Array.isArray(newObj) ? newObj : {}
    const keys = new Set([...Object.keys(o), ...Object.keys(n)])
    const alignedOld = {}
    const alignedNew = {}
    for (const key of keys) {
      alignedOld[key] = key in o ? o[key] : fill
      alignedNew[key] = key in n ? n[key] : fill
    }
    return [alignedOld, alignedNew]
  }

  const handleAlteration = (value, obj) => {
    copyObj.value = value
    copyObjStr = JSON.stringify(value)
  }

  const isAlteration = computed(() => {
    return copyObjStr === JSON.stringify(copyObj.value)
  })

  const updateAlteration = computed(() => {
    return handleUpdateAlteration(copyObjStr, copyObj.value)
  })

  const handleUpdateAlteration = (copyObjStr, copyObj) => {
    if (copyObjStr === JSON.stringify(copyObj)) {
      return false
    }
    const obj = {}
    const copyObjJson = copyObjStr ? JSON.parse(copyObjStr) : {}
    for (const key in copyObj) {
      if (JSON.stringify(copyObjJson[key]) != JSON.stringify(copyObj[key])) {
        obj[key] = [copyObjJson[key], copyObj[key]]
      }
    }
    return Object.keys(obj).length ? obj : false
  }

  const handleAlterationArray = (t, u, { key = 'uuid' } = { key: 'uuid' }) => {
    let t_obj = {}
    let u_obj = {}
    if (Array.isArray(t)) {
      t_obj = (t || []).reduce((acc, curr) => {
        acc[curr[key]] = curr
        return acc
      }, {})
      u_obj = (u || []).reduce((acc, curr) => {
        acc[curr[key]] = curr
        return acc
      }, {})
    } else {
      ;[t_obj, u_obj] = alignObjKeys(t, u)
    }
    const { diffData, nullKey, addKey } = jsonAlteration(t_obj, u_obj)
    return { diffData, nullKey, addKey }
  }

  const handleUpdateAlterationArray = ({ diffData, nullKey, addKey, keyStr = '' }, strObj = {}) => {

    let updateAlterationArray = {}
    for (const key in diffData) {
      let arr = diffData[key]
      let obj = handleUpdateAlteration(JSON.stringify(arr[0]), arr[1])
      let _key = keyStr ? arr[0][keyStr] || keyStr : key
      updateAlterationArray[_key] = filterAlterationNames(obj, strObj)
    }

    return { updateAlterationArray }
  }

  const jsonAlteration = (t, u) => {
    const diffData = {}
    const nullKey = {}
    const addKey = []
    t = t && typeof t === 'object' ? t : {}
    u = u && typeof u === 'object' ? u : {}

    for (const key in t) {
      if (!(key in u)) {
        nullKey[key] = t[key]
        continue
      }
      if (JSON.stringify(t[key]) !== JSON.stringify(u[key])) {
        diffData[key] = [t[key], u[key]]
      }
    }
    for (const key in u) {
      if (!(key in t)) {
        addKey.push(u[key])
      }
    }
    return { diffData, nullKey, addKey }
  }

  const filterAlterationNames = (data, fieldMap = {}) => {
    if (!data) return {}
    const result = {}
    for (const key in data) {
      const config = fieldMap[key]
      if (!config) continue
      const pair = data[key]
      if (typeof config === 'string') {
        result[config] = pair
        continue
      }
      const title = config.title || key
      if (!config.list) {
        result[title] = pair
        continue
      }
      const valueKey = config.value || 'value'
      const labelKey = config.label || 'label'
      const lookup = Array.isArray(config.list)
        ? config.list.reduce((acc, row) => {
          acc[row[valueKey]] = row[labelKey]
          return acc
        }, {})
        : config.list
      result[title] = pair.map((val) =>
        Array.isArray(val)
          ? val.map((z) => lookup[z]?.[valueKey] ?? lookup[z] ?? z)
          : lookup[val]?.[valueKey] ?? lookup[val] ?? val,
      )
    }
    return result
  }

  const getFilterList = (data) => {
    let arr = data.map(e => {
      let content = e.content
      if (isJSON(content)) {
        content = JSON.parse(content)
      }
      return {
        ...e,
        content: content
      }
    })
    return arr
  }
  return {
    handleUpdateAlterationArray,
    handleAlterationArray,
    handleUpdateAlteration,
    jsonAlteration,
    getFilterList,
    filterAlterationNames,
    handleAlteration,
    isAlteration,
    updateAlteration
  }
}
