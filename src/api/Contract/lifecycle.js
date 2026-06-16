import request from '@/http/index'

export function getContractList(data) {
  return request({
    url: '/api/contract/list',
    method: 'get',
    params: data
  })
}

export function getContractDetail(data) {
  return request({
    url: '/api/contract/detail',
    method: 'get',
    params: data
  })
}

export function getContractProcessInstances(data) {
  return request({
    url: '/api/contract/getProcessInstances',
    method: 'get',
    params: data
  })
}

export function addContract(data) {
  return request({
    url: '/api/contract/add',
    method: 'post',
    data: data
  })
}

export function updateContract(data) {
  return request({
    url: '/api/contract/update',
    method: 'post',
    data: data
  })
}

export function deleteContract(data) {
  return request({
    url: '/api/contract/delete',
    method: 'post',
    data: data
  })
}

export function submitContractToDing(data) {
  return request({
    url: '/api/contract/submitToDing',
    method: 'post',
    data: data
  })
}

export function approveContract(data) {
  return request({
    url: '/api/contract/approve',
    method: 'post',
    data: data
  })
}

export function archiveContract(data) {
  return request({
    url: '/api/contract/archive',
    method: 'post',
    data: data
  })
}

export function getContractBillList(data) {
  return request({
    url: '/api/contract/billList',
    method: 'get',
    params: data
  })
}

export function contractFinalCreate(data) {
  return request({
    url: '/api/contract/finalCreate',
    method: 'post',
    data: data
  })
}

export function contractFinalUpdate(data) {
  return request({
    url: '/api/contract/finalUpdate',
    method: 'post',
    data: data
  })
}

export function getContractFinalList(data) {
  return request({
    url: '/api/contract/finalList',
    method: 'get',
    params: data
  })
}

export function contractFinalDelete(data) {
  return request({
    url: '/api/contract/finalDelete',
    method: 'post',
    data: data
  })
}

export function contractFinalSubmit(data) {
  return request({
    url: '/api/contract/finalSubmit',
    method: 'post',
    data: data,
  })
}

export function approveContractFinal(data) {
  return request({
    url: '/api/contract/finalApprove',
    method: 'post',
    data: data
  })
}
