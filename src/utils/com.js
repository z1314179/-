import * as dingtalk from 'dingtalk-jsapi'

/** ISO 8601 无秒时部分环境解析失败，补全为 :00（如 2026-05-14T16:59Z） */
function normalizeParseableDateInput(value) {
  if (typeof value !== 'string') return value
  const s = value.trim()
  // 仅处理 …T时:分Z，避免误改已带秒或带偏移量的串
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z$/.test(s)) {
    return `${s.slice(0, -1)}:00Z`
  }
  return s
}

/** 带 Z 的 ISO 串表示 UTC 时刻，按 UTC 取年月日时分秒，避免东八区显示成次日 */
function isUtcZuluIsoString(value) {
  if (typeof value !== 'string') return false
  const s = value.trim()
  return s.includes('T') && /Z$/i.test(s)
}

export const formatDateTime = function (value, cur = 'yyyy-MM-dd HH:mm:ss') {
  if (value === null || value === undefined || value === '') return ''
  const normalized = typeof value === 'string' ? normalizeParseableDateInput(value) : value
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return ''
  const useUtc = typeof normalized === 'string' && isUtcZuluIsoString(normalized)
  const tf = function (i) {
    return (i < 10 ? '0' : '') + i
  }
  const _time = cur.replace(/yyyy|MM|dd|HH|mm|ss/g, function (a) {
    switch (a) {
      case 'yyyy':
        return tf(useUtc ? date.getUTCFullYear() : date.getFullYear())
      case 'MM':
        return tf(useUtc ? date.getUTCMonth() + 1 : date.getMonth() + 1)
      case 'dd':
        return tf(useUtc ? date.getUTCDate() : date.getDate())
      case 'HH':
        return tf(useUtc ? date.getUTCHours() : date.getHours())
      case 'mm':
        return tf(useUtc ? date.getUTCMinutes() : date.getMinutes())
      case 'ss':
        return tf(useUtc ? date.getUTCSeconds() : date.getSeconds())
    }
  })
  return _time
}
export const getSidUuid = function () {
  var s = []
  var hexDigits = '0123456789abcdefghijklmnopqrstuvwxyz'
  for (var i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1)
  }
  s[14] = '4'
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1)
  s[8] = s[13] = s[18] = s[23] = '_'
  const uuid = s.join('')
  return 'sid_' + uuid
}
export const getTitle = function (val) {
  if (window.navigator.userAgent.includes('DingTalk')) {
    dingtalk.ready(function () {
      dingtalk.biz.navigation.setTitle({
        title: val
      })
    })
  } else {
    document.title = val
  }
}
export const validPhone = function (val) {
  const reg = /^1[3|4|5|6|7|8|9][0-9]\d{8}$/
  return reg.test(val)
}
// 保留两位小数不四舍五入
export const handleParseint = (num, fixed = 2) => {
  if (num === null || num === undefined || num === '') return ''

  const str = String(num)
  const isNeg = str.startsWith('-')
  const absStr = isNeg ? str.slice(1) : str

  const [intPart, decPart = ''] = absStr.split('.')

  // 截断到 fixed 位，不足补 0
  const fixedDec = decPart.padEnd(fixed, '0').slice(0, fixed)

  // 组装结果
  let res = fixedDec ? `${intPart}.${fixedDec}` : intPart
  res = Number(res)
  return isNeg ? `-${res}` : res
}
/**
 * 数字格式化
 * @param {number|string} value 要格式化的值
 */
export const numberFormatter = (value) => {
  if (value === null || value === undefined || value === '') {
    return ''
  }
  if (Number.isNaN(Number(value))) {
    return value
  }
  const num = Number(value)
  if (Number.isInteger(num)) {
    return num.toString()
  }
  return num
}

// 金额处理
export const nFormat = (value, fixed = 2) => {
  if (value === null || value === undefined || value === '') {
    return ''
  }
  if (Number.isNaN(Number(value))) {
    return value
  }
  const num = Number(value || 0)
  return num.toFixed(fixed)
}

/**
 * 金额展示：千分位 + 固定小数（默认两位，先四舍五入到 fixed 位）
 * 用于合同总金额、已创建/未创建金额等展示
 */
export const formatAmountDisplay = (value, fixed = 2) => {
  if (value === null || value === undefined || value === '') {
    return ''
  }
  const num = Number(value)
  if (Number.isNaN(num)) {
    return String(value)
  }
  const factor = 10 ** fixed
  const rounded = Math.round(num * factor) / factor
  return rounded.toLocaleString('zh-CN', {
    minimumFractionDigits: fixed,
    maximumFractionDigits: fixed,
  })
}

/** 判断字符串是否为可被 JSON.parse 解析的合法 JSON */
export const isJSON = (str) => {
  if (typeof str !== 'string') return false
  const s = str.trim()
  if (!s) return false
  try {
    JSON.parse(s)
    return true
  } catch {
    return false
  }
}

/** 在日历上给 src 加 delta 个月，保持「同日」；目标月没有该日时取该月最后一天（如 1/31 +1月 → 2/28） */
function addCalendarMonths(src, delta) {
  const y = src.getFullYear()
  const m = src.getMonth()
  const day = src.getDate()
  const base = new Date(y, m + delta, 1)
  const last = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate()
  return new Date(base.getFullYear(), base.getMonth(), Math.min(day, last))
}

function parseRangeDate(s) {
  if (s == null || s === '') return null
  if (typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.trim())) {
    const [yy, mm, dd] = s.split('-').map((x) => Number(x))
    const d = new Date(yy, mm - 1, dd)
    return Number.isNaN(d.getTime()) ? null : d
  }
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

function startOfLocalDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}
export const getDateRangeApproxMonths = (range) => {
  if (!range || !Array.isArray(range) || range.length < 2) return ''
  const [startDate, endDate] = range
  if (startDate == null || endDate == null || startDate === '' || endDate === '') {
    return ''
  }
  const start = parseRangeDate(startDate)
  const end = parseRangeDate(endDate)
  if (!start || !end) return ''
  if (startOfLocalDay(end) < startOfLocalDay(start)) return ''

  let n = 1
  while (startOfLocalDay(addCalendarMonths(start, n)) < startOfLocalDay(end)) {
    n++
    if (n > 12000) return ''
  }
  return n
}

/**
 * 判断值是否为有效数字
 * @param {*} val 要检测的值
 */
export const isNumeric = (val) => {
  if (Number.isNaN(Number(value))) {
    return value
  }
  if (typeof val === 'string') {
    const trimmed = val.trim()
    return trimmed !== '' && Number.isFinite(Number(trimmed))
  }
  return false
}
export const parseUrlParams = (url) => {
  const [path, queryString] = url.split('?');

  function parseQuery(qs) {
    if (!qs) return {};
    return qs.split('&').reduce((params, param) => {
      const [key, value] = param.split('=');
      params[key] = decodeURIComponent(value || '');
      return params;
    }, {});
  }

  return {
    path: path,
    query: parseQuery(queryString)
  };
}


/** 匹配整数、小数（含 .5 形式）及可选负号，不作为数字内部的千分位逗号 */
const NUMBER_TOKEN_RE =
  /-?\d{1,3}(?:,\d{3})+(?:\.\d+)?|-?(?:\d+(?:\.\d+)?|\.\d+)/g
export const extractNumberParts = (str) => {
  const original = str == null ? '' : String(str)
  const matches = original.match(NUMBER_TOKEN_RE)
  const numbers = matches && matches.length ? matches.join('; ') : ''
  return { original, numbers }
}
//是数字默认两位小数
export const toFixedNumberString = (val, digits = 2) => {
  if (val === null || val === undefined || val === '' || !Number.isFinite(Number(val))) {
    return undefined
  }
  return Number(val).toFixed(digits)
}