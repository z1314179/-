import request from '@/http/index'

export function getDataMgmtList(data) {
  return request({
    url: '/api/transfer/index',
    method: 'post',
    data,
  })
}
// 获取数据管理详情
export function getDataMgmtDetail(data) {
  return request({
    url: '/api/transfer/info',
    method: 'post',
    data,
  })
}
// 创建数据管理
export function addDataMgmt(data) {
  return request({
    url: '/api/transfer/create',
    method: 'post',
    data,
  })
}
// 编辑数据管理
export function updateDataMgmt(data) {
  return request({
    url: '/api/transfer/update',
    method: 'post',
    data,
  })
}
// 删除数据管理
export function delDataMgmt(data) {
  return request({
    url: '/api/transfer/delete',
    method: 'post',
    data,
  })
}