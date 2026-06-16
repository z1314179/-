import axios from 'axios'
import useStore from '@/store/user.js'
import {
  message
} from "ant-design-vue";
axios.defaults.headers['Content-Type'] = 'application/json'
axios.defaults.headers['Access-Control-Allow-Credentials'] = true
axios.defaults.headers['Access-Control-Allow-Origin'] = '*'
axios.defaults.headers['Access-Control-Allow-Methods'] = 'PUT,POST,OPTIONS,GET'
// axios.defaults.withCredentials = true
const version = process.env.VERSION //升级版本
import fn from '@/utils/getV.js'
const service = axios.create({
  baseURL: process.env.API,
  timeout: 600000,
  // withCredentials: true,
})
// 异常
service.interceptors.request.use(config => {
  const store = useStore()
  // 支持多前缀代理：默认走 /api；当接口自身以 /nodeApi 开头时，不再拼接 baseURL
  if (typeof config.url === 'string' && config.url.startsWith('/nodeApi')) {
    config.baseURL = ''
  }
  // 是否需要设置 token、
  config.credentials = true
  const token = store.getCToken ? store.getCToken() : store.token
  config.headers.Authorization = 'Bearer ' + token
  // FormData 必须让浏览器/axios 自动带 boundary，不能沿用默认 application/json
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
}, error => {
  Promise.reject(error)
})

// 响应拦截器

service.interceptors.response.use(res => {
  if (version) {
    //非本地情况
    fn(version)
  }
  // PDF 等二进制响应直接返回 Blob，不走业务 JSON 解析
  if (res.config.responseType === 'blob' || res.data instanceof Blob) {
    return res.data
  }
  const code = res.data.errno
  const msg = (res.data.errmsg)
  if (code === 0) return res.data
  if (res.config.errorNone) return res.data
  if (code === 501 || code === 700) {
    errmsg(msg)
    const store = useStore()
    store.outLogin()
    return Promise.reject()
  } else if (code === 502) {
    errmsg(msg)
    return Promise.reject()
  } else {
    message.warning(msg || '网络异常')
    return res.data
  }

},
  async error => {
    const data = error.response?.data
    if (data instanceof Blob && data.type?.includes('json')) {
      try {
        const json = JSON.parse(await data.text())
        message.warning(json.error || '请求失败')
        return Promise.reject(new Error(json.error || '请求失败'))
      } catch {
        // fall through
      }
    }
    message.warning(error.response?.data?.error || error.message || '网络异常')
    return Promise.reject(error)
  }
)
let timer = null

function errmsg(msg = '网络异常') {
  if (timer) return
  message.warning(msg)
  timer = setTimeout(() => {
    timer = null
  }, 2000)
}
export default service