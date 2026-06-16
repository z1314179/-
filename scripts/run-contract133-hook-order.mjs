import { readFileSync } from 'fs'
import { buildDingApprovalFlowWithHistories, buildTableData } from '../src/views/Contract/useApprovalDetailTimeline.js'

const input = JSON.parse(readFileSync(new URL('../contract-133-workflow.json', import.meta.url), 'utf8'))

const userNameMap = {
  '1746141718696185': '北辰',
  '0819694451648267': '九月',
}
;(input.workflowActivityRules || []).forEach((rule) => {
  ;(rule.activityActioners || []).forEach((a) => {
    if (a.userId && a.name) userNameMap[a.userId] = a.name
  })
})

const records = input.processInstances.operationRecords || []
console.log('=== 原始 operationRecords 顺序 ===')
records.forEach((r, i) => {
  console.log(`${i + 1}. ${r.date?.slice(11, 16) || ''} ${r.type} ${r.showName || ''} userId=${r.userId}`)
})

const result = buildDingApprovalFlowWithHistories(input, userNameMap)
const rows = buildTableData(result)

console.log('\n=== hook 表格行顺序 ===')
rows.forEach((row, i) => {
  console.log(`${i + 1}. [${row.statusCode}] ${row.status} | ${row.displayApprover} | ${row.displayDate || '-'}`)
})

console.log('\n=== 21:56 附近原始记录 ===')
records.filter((r) => r.date?.includes('21:56')).forEach((r, i) => {
  console.log(`  ${i + 1}. ${r.type} ${r.showName} ${r.userId}`)
})

console.log('\n=== 21:56 附近表格行（含加签/审批） ===')
rows.filter((r) => r.displayDate?.includes('21:56') || r.displayApprover?.includes('21:56') || r.displayApprover?.includes('后加签')).forEach((row, i) => {
  console.log(`  ${i + 1}. ${row.status} | ${row.displayApprover} | ${row.displayDate || '-'}`)
})
