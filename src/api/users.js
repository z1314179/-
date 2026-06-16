import request from '@/http/index'

export function getAdminPermissions(data) {
  return request({
    url: '/api/roles/getAdminPermissions',
    method: 'get',
    params: data
  })
}
// 部门列表
export function getDepartmentList(data) {
  return request({
    url: '/api/organization/list',
    method: 'get',
    params: data
  })
}
// 删除部门
export function delDepartment(data) {
  return request({
    url: '/api/organization/del',
    method: 'post',
    data: data
  })
}
// 新增部门
export function addDepartment(data) {
  return request({
    url: '/api/organization/add',
    method: 'post',
    data: data
  })
}
// 更新部门
export function updateDepartment(data) {
  return request({
    url: '/api/organization/edit',
    method: 'post',
    data: data
  })
}
// 用户列表
export function getTableList(data) {
  return request({
    url: '/api/user/list',
    method: 'get',
    params: data
  })
}
// 删除用户
export function delUser(data) {
  return request({
    url: '/api/user/delete',
    method: 'post',
    params: data
  })
}
// 用户详情
export function getUserDetails(data) {
  return request({
    url: '/api/user/detail',
    method: 'get',
    params: data
  })
}
// 新增用户
export function addUser(data) {
  return request({
    url: '/api/user/add',
    method: 'post',
    data: data
  })
}
// 更新用户
export function updateUser(data) {
  return request({
    url: '/api/user/update',
    method: 'post',
    data: data
  })
}
// 更新用户
export function updateStatus(data) {
  return request({
    url: '/api/organization/updateStatus',
    method: 'post',
    data: data
  })
}
// 批量修改状态
// 导出一个函数，用于更新状态
export function updateType(data) {
  return request({
    url: '/api/user/updateType',
    method: 'post',
    data: data
  })
}
// 批量启用/停用 ids、type
export function batchChangeType(data) {
  return request({
    url: '/api/user/batchChangeType',
    method: 'post',
    data: data,
  })
}