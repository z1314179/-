import request from '@/http/index'

export function getRoutes(data) {
    return request({
        url: '/api/auth/getRoutes',
        method: 'get',
        params: data
    })
}
export function getMenuList(data) {
    return request({
        url: '/api/auth/getMenuList',
        method: 'get',
        params: data
    })
}

export function addMenu(data) {
    return request({
        url: '/api/auth/addMenu',
        method: 'post',
        data: data
    })
}
export function editMenu(data) {
    return request({
        url: '/api/auth/editMenu',
        method: 'post',
        data: data
    })
}
export function delMenu(data) {
    return request({
        url: '/api/auth/delMenu',
        method: 'post',
        data: data
    })
}