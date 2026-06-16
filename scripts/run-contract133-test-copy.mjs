import { readFileSync } from 'fs'
import { buildDingApprovalFlowWithHistories } from '../src/views/Contract/test copy.js'

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

const result = buildDingApprovalFlowWithHistories(input, userNameMap)
console.log(result)
console.log('\n=== 含「或签」的行 ===')
result.split('\n').filter((line) => line.includes('或签')).forEach((line) => console.log(line))
