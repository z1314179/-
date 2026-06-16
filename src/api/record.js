import request from '@/http/index'
// objectIdArray: [props.detailInfo.id],
// module: "supplier",
// type: type,
// content:
export function addLog(data) {
    return request({
        url: '/api/operating/log',
        method: 'post',
        data: data
    })
}
export function getLog(data) {
    return request({
        url: '/api/operating/log',
        method: 'get',
        params: data
    })
}