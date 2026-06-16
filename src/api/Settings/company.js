import request from '@/http/index'

export function getCompanyList(data) {
  return request({
    url: '/api/company/index',
    method: 'post',
    params: data
  })
}
// 详情
export function getCompanyDetail(data) {
  return request({
    url: '/api/company/info',
    method: 'post',
    data,
  })
}
// 新增
export function addCompany(data) {
  return request({
    url: '/api/company/create',
    method: 'post',
    data,
  })
}
// 编辑
export function updateCompany(data) {
  return request({
    url: '/api/company/update',
    method: 'post',
    data,
  })
}
// 删除
export function delCompany(data) {
  return request({
    url: '/api/company/delete',
    method: 'post',
    data,
  })
}
// 更新状态
export function updateStatus(data) {
  return request({
    url: '/api/company/operation',
    method: 'post',
    data,
  })
}
