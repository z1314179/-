import request from '@/http/index'

export function getAlertList(data) {
  return request({
    url: '/api/warning/rules',
    method: 'get',
    params: data
  })
}

// 新增预警
export function addAlert(data) {
  return request({
    url: '/api/warning/rules',
    method: 'post',
    data
  })
}

// 修改预警
export function updateAlert(id, data) {
  return request({
    url: `/api/warning/rules/${id}`,
    method: 'put',
    data
  })
}
// 删除预警
export function deleteAlert(id) {
  return request({
    url: `/api/warning/rules/${id}`,
    method: 'delete',
  })
}
// 更新状态
export function updateStatus(id, data) {
  return request({
    url: `api/warning/rules/change/status/${id}`,
    method: 'put',
    data
  })
}
