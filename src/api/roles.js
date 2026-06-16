import request from '@/http/index'
// 列表
export function getTableList(data) {
  return request({
    url: '/api/roles/list',
    method: 'get',
    params: data
  })
}
// 删除用户
export function delRole(data) {
  return request({
    url: '/api/roles/delRole',
    method: 'post',
    data: data
  })
}
// 用户详情
export function getRoleDetails(data) {
  return request({
    url: '/api/roles/detail',
    method: 'get',
    params: data
  })
}
// 获取所有权限

// 关联用户
export function batchUpdateUsersRole(data) {
  return request({
    url: '/api/roles/batchUpdateUsersRole',
    method: 'post',
    data: data
  })
}
// 新增用户
export function addRole(data) {
  return request({
    url: '/api/roles/add',
    method: 'post',
    data: data
  })
}
// 更新用户
export function updateRole(data) {
  return request({
    url: '/api/roles/update',
    method: 'post',
    data: data
  })
}
// 批量启用/停用 ids、type
export function batchChangeType(data) {
  return request({
    url: '/api/roles/batchChangeType',
    method: 'post',
    data: data,
  })
}

// 管理员权限
export function getAdminRole(data) {
  return request({
    url: '/api/roles/getAdminPermissions',
    method: 'get',
    params: data
  })
}