import request from '@/http/index'
export function getIntentionContractList(data) {
  return request({
    url: '/api/intentionContract/list',
    method: 'get',
    params: data
  })
}
export function getIntentionContractDetail(data) {
  return request({
    url: '/api/intentionContract/detail',
    method: 'get',
    params: data
  })

}
export function getMaycurTypeSearch(data) {
  return request({
    url: '/api/maycur/typeSearch',
    method: 'get',
    params: data
  })
}
export function createIntentionContract(data) {
  return request({
    url: '/api/intentionContract/add',
    method: 'post',
    data: data
  })
}
export function updateIntentionContract(data) {
  return request({
    url: '/api/intentionContract/update',
    method: 'post',
    data: data
  })
}
export function deleteIntentionContract(data) {
  return request({
    url: '/api/intentionContract/delete',
    method: 'post',
    data: data
  })
}
export function getIntentionContractHistory(data) {
  return request({
    url: '/api/intentionContract/history',
    method: 'get',
    params: data
  })
}
export function submitToDing(data) {
  return request({
    url: '/api/intentionContract/submitToDing',
    method: 'post',
    data: data
  })
}
export function approveIntentionContract(data) {
  return request({
    url: '/api/intentionContract/approve',
    method: 'post',
    data: data
  })
}

export function getProcessInstances(data) {
  return request({
    url: '/api/intentionContract/getProcessInstances',
    method: 'get',
    params: data
  })
}
export function postDingFile(data) {
  return request({
    url: '/api/ding/postDingFile',
    method: 'post',
    data: data
  })
}

export function getDingUserList(data) {
  return request({
    url: '/api/ding/userList',
    method: 'get',
    params: data
  })
}
export function approveContract(data) {
  return request({
    url: '/api/intentionContract/approve',
    method: 'post',
    data: data
  })
}