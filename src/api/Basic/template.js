import request from '@/http/index'
import mock from '@/api/Basic/mock.json'

export function getTemplateList(data) {
  return request({
    url: '/api/template/list',
    method: 'get',
    params: data
  })
}
export function getTemplateDetail(data) {
  return request({
    url: '/api/template/detail',
    method: 'get',
    params: data
  })
}
export function deleteTemplate(data) {
  return request({
    url: '/api/template/delete',
    method: 'post',
    data: data
  })
}
export function changeStatusTemplate(data) {
  return request({
    url: '/api/template/changeStatus',
    method: 'post',
    data: data
  })
}
export function addTemplate(data) {
  return request({
    url: '/api/template/add',
    method: 'post',
    data: data
  })
}
export function getDingModel(data) {
  return request({
    url: '/api/template/getDingModel',
    method: 'get',
    params: data
  })


  // return mock
}
export function updateTemplate(data) {
  return request({
    url: '/api/template/update',
    method: 'post',
    data: data
  })
}