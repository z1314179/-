import { ref } from 'vue'
import { getDingUserList } from '@/api/Contract/intention'

function isCurrentProcessHistory(history, currentBusinessId) {
  if (currentBusinessId == null || currentBusinessId === '') return false

  const historyBusinessId = history?.businessId
    ?? history?.dingProcessBusinessId
    ?? history?.extJson?.businessId

  return historyBusinessId == currentBusinessId
}

function buildDingApprovalFlowWithHistories(input, extraUserNameMap = {}) {
  const historyFlows = []

  const currentBusinessId = input.processInstances?.businessId
  const histories = (input.processHistories || [])
    .slice()
    .filter((h) => !isCurrentProcessHistory(h, currentBusinessId))
    .sort((a, b) => Number(a.id || 0) - Number(b.id || 0))

  histories.forEach((history) => {
    const historyInput = normalizeHistoryProcess(history)

    if (!historyInput.processInstances) {
      return
    }

    historyFlows.push({
      section: 'history',
      items: buildDingApprovalFlow(historyInput, extraUserNameMap, 'history'),
    })
  })

  return {
    historyFlows,
    current: {
      section: 'current',
      items: buildDingApprovalFlow(input, extraUserNameMap, 'current'),
    },
  }
}

function normalizeHistoryProcess(history) {
  return {
    workflowForecastNodes: history?.forecastJson?.workflowForecastNodes || [],
    workflowActivityRules: history?.forecastJson?.workflowActivityRules || [],
    processInstances: history?.extJson || null,
  }
}

function buildDingApprovalFlow(input, extraUserNameMap = {}, section = 'current') {
  const workflowForecastNodes = input.workflowForecastNodes || []
  const workflowActivityRules = input.workflowActivityRules || []
  const instance = input.processInstances || {}

  const operationRecords = (instance.operationRecords || []).slice()

  const tasks = (instance.tasks || [])
    .slice()
    .sort((a, b) => {
      return toTime(a.createTime) - toTime(b.createTime)
        || Number(a.taskId || 0) - Number(b.taskId || 0)
    })

  const userNameMap = buildUserNameMap({
    workflowActivityRules,
    tasks,
    operationRecords,
    extraUserNameMap,
  })

  const usedTaskIds = new Set()
  const taskAppendTypeMap = new Map()
  const appendRelations = []

  for (const record of operationRecords) {
    if (!isAppendRecord(record)) continue

    const appendTasks = findAppendTasks(record, tasks, usedTaskIds)
    const groupTasks = refineAppendGroupTasks(
      { record, tasks: appendTasks },
      operationRecords,
      tasks,
    )
    const groupTaskIds = new Set(groupTasks.map(task => task.taskId))

    for (const task of appendTasks) {
      if (!groupTaskIds.has(task.taskId)) continue

      usedTaskIds.add(task.taskId)
      taskAppendTypeMap.set(task.taskId, record.type)
    }

    appendRelations.push({
      record,
      tasks: appendTasks,
      groupTasks,
    })
  }

  const items = []

  for (const record of operationRecords) {
    if (record.type === 'START_PROCESS_INSTANCE') {
      items.push(createRecordItem({
        section,
        id: record.id,
        status: record.showName || '发起申请',
        displayApprover: getName(record.userId, userNameMap),
        date: record.date,
        remark: record.remark || '',
        statusCode: 2,
      }))
      continue
    }

    if (isAppendRecord(record)) {
      const relation = appendRelations.find(item => item.record === record)

      items.push(createRecordItem({
        section,
        id: record.id,
        status: getAppendStatusName(record),
        displayApprover: getName(record.userId, userNameMap),
        date: record.date,
        remark: record.remark || '',
        statusCode: 2,
      }))

      if (relation && shouldRenderAppendGroup(relation)) {
        renderAppendGroup(items, relation, userNameMap, section)
      }

      continue
    }

    if (record.type === 'PROCESS_CC') {
      items.push(createProcessCcRecordItem(record, userNameMap, section))
      continue
    }

    if (record.type === 'EXECUTE_TASK_NORMAL') {
      const task = findExecuteTask(record, tasks)
      if (!task) continue

      if (isInGroupedAppendTask(task, appendRelations)) {
        continue
      }

      const appendType = taskAppendTypeMap.get(task.taskId)

      items.push(createRecordItem({
        section,
        id: record.id || task.taskId,
        status: getExecuteStatusName(appendType, record.showName),
        displayApprover: getName(task.userId, userNameMap),
        date: task.finishTime || record.date,
        remark: record.remark || '',
        statusCode: task.result === 'REFUSE' ? 3 : 2,
      }))
    }
  }

  if (instance.status === 'RUNNING') {
    renderForecastUnfinishedNodes({
      items,
      workflowForecastNodes,
      workflowActivityRules,
      operationRecords,
      tasks,
      usedTaskIds,
      userNameMap,
      section,
    })
  }

  return items
}

function getExecuteStatusName(appendType, showName = '审批人') {
  const appendTypeText = getAppendTypeText(appendType)
  return appendTypeText ? `${showName}（${appendTypeText}）` : showName
}

function getAppendStatusName(record) {
  const showName = record.showName || '审批人'
  const appendTypeText = getAppendTypeText(record.type)
  return appendTypeText ? `${showName}（${appendTypeText}）` : showName
}

function getAppendTypeText(recordType) {
  if (recordType === 'APPEND_TASK_BEFORE') return '前加签'
  if (recordType === 'APPEND_TASK_AFTER') return '后加签'
  return ''
}

function createProcessCcRecordItem(record, userNameMap, section) {
  const ccUserIds = record.ccUserIds || []
  const displayApprover = ccUserIds
    .map(userId => getName(userId, userNameMap))
    .join('、')

  return createRecordItem({
    section,
    id: record.id || `${record.type}-${record.activityId || ''}-${record.date || ''}`,
    status: record.showName || '抄送人',
    displayApprover: displayApprover || '未识别',
    date: record.date,
    remark: record.remark || '',
    statusCode: 2,
  })
}

function renderForecastUnfinishedNodes({
  items,
  workflowForecastNodes,
  workflowActivityRules,
  operationRecords,
  tasks,
  usedTaskIds,
  userNameMap,
  section,
}) {
  const orderedRules = getRulesByForecastOrder(workflowForecastNodes, workflowActivityRules)

  for (const rule of orderedRules) {
    const activityId = rule.activityId
    const hasProcessCcRecord = operationRecords.some(record => {
      return record.type === 'PROCESS_CC' && record.activityId === activityId
    })

    if ((rule?.workflowActor?.actorType === 'notifier' || rule.activityName === '抄送人') && hasProcessCcRecord) {
      continue
    }

    const nodeTasks = tasks.filter(task => {
      if (task.activityId !== activityId) return false
      if (usedTaskIds.has(task.taskId)) return false

      return ['PAUSED', 'NEW', 'RUNNING'].includes(task.status)
    })

    if (nodeTasks.length > 0) {
      renderGeneratedOriginalNode(items, rule, nodeTasks, userNameMap, section)
      continue
    }

    const hasAnyTask = tasks.some(task => task.activityId === activityId)

    if (!hasAnyTask) {
      renderNotStartedOriginalNode(items, rule, userNameMap, section)
    }
  }
}

function renderGeneratedOriginalNode(items, rule, nodeTasks, userNameMap, section) {
  const method = getApprovalMethod(rule)
  const statusCode = nodeTasks.some(task => task.status === 'RUNNING') ? 1 : 0
  const activityName = rule.activityName || '审批人'
  const displayApprover = formatPendingUsers(
    nodeTasks.map(task => getName(task.userId, userNameMap)),
    method,
  )

  if (method === 'ONE_BY_ONE') {
    items.push(createRecordItem({
      section,
      id: rule.activityId,
      status: activityName,
      displayApprover,
      date: '',
      remark: '',
      statusCode,
    }))
    return
  }

  if (method === 'OR') {
    items.push(createRecordItem({
      section,
      id: rule.activityId,
      status: activityName,
      displayApprover,
      date: '',
      remark: '',
      statusCode,
    }))
    return
  }

  items.push(createRecordItem({
    section,
    id: rule.activityId,
    status: activityName,
    displayApprover,
    date: '',
    remark: '',
    statusCode,
  }))
}

function renderNotStartedOriginalNode(items, rule, userNameMap, section) {
  const actioners = rule.activityActioners || []
  const method = getApprovalMethod(rule)
  const activityName = rule.activityName || '审批人'
  const displayApprover = formatPendingUsers(
    actioners.map(user => getName(user.userId, userNameMap, user.name)),
    method,
  )

  if (method === 'ONE_BY_ONE') {
    items.push(createRecordItem({
      section,
      id: rule.activityId,
      status: activityName,
      displayApprover,
      date: '',
      remark: '',
      statusCode: 0,
    }))
    return
  }

  if (method === 'OR') {
    items.push(createRecordItem({
      section,
      id: rule.activityId,
      status: activityName,
      displayApprover,
      date: '',
      remark: '',
      statusCode: 0,
    }))
    return
  }

  if (rule?.workflowActor?.actorType === 'notifier' || activityName === '抄送人') {
    items.push(createRecordItem({
      section,
      id: rule.activityId,
      status: activityName,
      displayApprover,
      date: '',
      remark: '',
      statusCode: 0,
    }))
    return
  }

  items.push(createRecordItem({
    section,
    id: rule.activityId,
    status: activityName,
    displayApprover,
    date: '',
    remark: '',
    statusCode: 0,
  }))
}

function formatPendingUsers(names, method) {
  const displayNames = (names || []).filter(Boolean).join('、') || '未识别'
  if ((names || []).length <= 1) return displayNames

  return `${displayNames} ${getApprovalMethodText(method)}`
}

function getRulesByForecastOrder(workflowForecastNodes, workflowActivityRules) {
  const orderMap = new Map()

  workflowForecastNodes.forEach((node, index) => {
    orderMap.set(node.activityId, index)
  })

  return workflowActivityRules
    .slice()
    .sort((a, b) => {
      const aOrder = orderMap.has(a.activityId) ? orderMap.get(a.activityId) : 999999
      const bOrder = orderMap.has(b.activityId) ? orderMap.get(b.activityId) : 999999

      return aOrder - bOrder
    })
}

function findAppendTasks(record, tasks, usedTaskIds) {
  const recordTime = toTime(record.date)

  const candidates = tasks.filter(task => {
    if (usedTaskIds.has(task.taskId)) return false
    if (task.activityId !== record.activityId) return false
    if (toTime(task.createTime) < recordTime) return false

    return true
  })

  if (candidates.length === 0) return []

  const groupMap = new Map()

  for (const task of candidates) {
    const key = task.createTime
    if (!groupMap.has(key)) {
      groupMap.set(key, [])
    }
    groupMap.get(key).push(task)
  }

  const groups = Array.from(groupMap.entries())
    .map(([createTime, groupTasks]) => ({
      createTime,
      tasks: groupTasks,
    }))
    .sort((a, b) => toTime(a.createTime) - toTime(b.createTime))

  for (const group of groups) {
    let groupTasks = dedupeUserTasks(group.tasks)

    const hasRealAppendStatus = groupTasks.some(task => {
      return ['COMPLETED', 'RUNNING', 'CANCELED'].includes(task.status)
    })

    if (hasRealAppendStatus) {
      groupTasks = groupTasks.filter(task => {
        return ['COMPLETED', 'RUNNING', 'CANCELED'].includes(task.status)
      })
    } else {
      groupTasks = groupTasks.filter(task => task.status !== 'PAUSED')
    }

    if (groupTasks.length > 0) {
      return groupTasks
    }
  }

  return []
}

function dedupeUserTasks(tasks) {
  const map = new Map()

  for (const task of tasks) {
    const old = map.get(task.userId)

    if (!old) {
      map.set(task.userId, task)
      continue
    }

    if (getTaskPriority(task) < getTaskPriority(old)) {
      map.set(task.userId, task)
    }
  }

  return Array.from(map.values())
    .sort((a, b) => Number(a.taskId || 0) - Number(b.taskId || 0))
}

function getTaskPriority(task) {
  const map = {
    COMPLETED: 1,
    RUNNING: 2,
    CANCELED: 3,
    NEW: 4,
    PAUSED: 5,
  }

  return map[task.status] || 99
}

function refineAppendGroupTasks(relation, operationRecords, tasks) {
  const appendTasks = relation.tasks || []
  if (appendTasks.length === 0) return []

  const runningTasks = appendTasks.filter(task => task.status === 'RUNNING')
  if (runningTasks.length === 0) return appendTasks

  const hasAgreed = appendTasks.some(task => {
    return task.status === 'COMPLETED' && task.result === 'AGREE'
  })

  if (hasAgreed) {
    return appendTasks.filter(task => task.status !== 'RUNNING')
  }

  const record = relation.record
  if (record.type === 'APPEND_TASK_AFTER') {
    const initiatorExecuted = operationRecords.some(op => {
      if (op.type !== 'EXECUTE_TASK_NORMAL') return false
      if (op.userId !== record.userId) return false
      if (op.activityId !== record.activityId) return false
      if (toTime(op.date) < toTime(record.date)) return false

      const task = findExecuteTask(op, tasks)
      return !!task?.finishTime
    })

    if (initiatorExecuted) {
      return appendTasks.filter(task => task.status !== 'RUNNING')
    }
  }

  return appendTasks
}

function shouldRenderAppendGroup(relation) {
  const tasks = relation.groupTasks || relation.tasks || []
  if (tasks.length === 0) return false

  const hasCanceled = tasks.some(task => task.status === 'CANCELED')
  const hasRunning = tasks.some(task => task.status === 'RUNNING')

  if (tasks.length > 1 && hasCanceled) return true
  if (hasRunning) return true

  return false
}

function renderAppendGroup(items, relation, userNameMap, section) {
  const tasks = relation.groupTasks || relation.tasks || []
  const status = getAppendStatusName(relation.record)
  const displayApprover = formatPendingUsers(
    tasks.map(task => getName(task.userId, userNameMap)),
    'OR',
  )

  const statusCode = resolveAppendGroupStatusCode(tasks)

  items.push(createRecordItem({
    section,
    id: `append-${relation.record.id || relation.record.activityId}`,
    status,
    displayApprover,
    date: getAppendGroupOperateDate(tasks, statusCode),
    remark: '',
    statusCode,
  }))
}

function isInGroupedAppendTask(task, appendRelations) {
  return appendRelations.some(relation => {
    if (!shouldRenderAppendGroup(relation)) return false

    const tasks = relation.groupTasks || relation.tasks || []
    return tasks.some(item => item.taskId === task.taskId)
  })
}

function findExecuteTask(record, tasks) {
  return tasks.find(task => {
    return task.userId === record.userId
      && task.activityId === record.activityId
      && task.result === record.result
      && task.finishTime
      && formatTime(task.finishTime) === formatTime(record.date)
  })
}

function resolveAppendGroupStatusCode(tasks) {
  if (tasks.some(task => task.status === 'RUNNING')) return 1
  if (tasks.some(task => task.status === 'COMPLETED' && task.result === 'REFUSE')) return 3
  if (tasks.some(task => task.status === 'COMPLETED' && task.result === 'AGREE')) return 2
  return 0
}

function getAppendGroupOperateDate(tasks, statusCode) {
  if (!shouldShowOperateDate(statusCode)) return ''
  const finishedTasks = tasks
    .filter(task => task.status === 'COMPLETED' && task.finishTime)
    .sort((a, b) => toTime(b.finishTime) - toTime(a.finishTime))

  return finishedTasks[0]?.finishTime || ''
}

function buildUserNameMap({
  workflowActivityRules,
  tasks,
  operationRecords,
  extraUserNameMap,
}) {
  const map = {
    ...extraUserNameMap,
  }

  for (const rule of workflowActivityRules || []) {
    for (const user of rule.activityActioners || []) {
      if (user.userId && user.name) {
        map[user.userId] = user.name
      }
    }
  }

  for (const task of tasks || []) {
    if (task.userId && !map[task.userId]) {
      map[task.userId] = task.userId
    }
  }

  for (const record of operationRecords || []) {
    if (record.userId && !map[record.userId]) {
      map[record.userId] = record.userId
    }

    for (const userId of record.ccUserIds || []) {
      if (userId && !map[userId]) {
        map[userId] = userId
      }
    }
  }

  return map
}

function getApprovalMethod(rule) {
  return rule?.workflowActor?.approvalMethod || ''
}

function getApprovalMethodText(method) {
  if (method === 'ONE_BY_ONE') return '依次审批'
  if (method === 'OR') return '或签'
  return '会签'
}

function isAppendRecord(record) {
  return record.type === 'APPEND_TASK_BEFORE'
    || record.type === 'APPEND_TASK_AFTER'
}

function getTaskStatusText(task) {
  if (task.status === 'COMPLETED' && task.result === 'AGREE') {
    return `已同意，${formatTime(task.finishTime)}`
  }

  if (task.status === 'COMPLETED' && task.result === 'REFUSE') {
    return `已拒绝，${formatTime(task.finishTime)}`
  }

  if (task.status === 'CANCELED') {
    return '已取消 / 未执行'
  }

  if (task.status === 'RUNNING') {
    return '审批中'
  }

  if (task.status === 'NEW') {
    return '未处理'
  }

  if (task.status === 'PAUSED') {
    return '暂停'
  }

  return task.status || '未处理'
}

function getResultText(task) {
  if (task.result === 'AGREE') return '已同意'
  if (task.result === 'REFUSE') return '已拒绝'

  return getTaskStatusText(task)
}

function getName(userId, userNameMap, defaultName = '') {
  return userNameMap[userId] || defaultName || userId
}

function toTime(value) {
  if (!value) return 0
  return new Date(value).getTime()
}

function formatTime(value) {
  if (!value) return ''
  return `${value.slice(5, 10)} ${value.slice(11, 16)}`
}

function shouldShowOperateDate(statusCode) {
  return statusCode !== 0 && statusCode !== 1
}

function createRecordItem({ section, id, status, displayApprover, date, remark, statusCode = 2 }) {
  const showDate = shouldShowOperateDate(statusCode)

  return {
    id: id ?? '',
    section,
    displayApprover: displayApprover || '',
    status: status || '',
    remark: remark || '',
    date: showDate ? (date || '') : '',
    displayDate: showDate ? formatTime(date) : '',
    statusCode,
  }
}

function itemsToTableRows(items) {
  let seq = 0

  return (items || []).map(item => ({
    ...item,
    id: `approval-row-${++seq}`,
    displayApprover: item.displayApprover || '',
    status: item.status || '',
    remark: item.remark || '-',
  }))
}

function buildTableData(result) {
  const rows = []

  result.historyFlows?.forEach((flow) => {
    rows.push(...itemsToTableRows(flow.items))
  })
  rows.push(...itemsToTableRows(result.current?.items))

  return rows
}

function pickListFromResponse(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.list)) return payload.list
  if (Array.isArray(payload?.rows)) return payload.rows
  if (Array.isArray(payload?.records)) return payload.records
  return []
}

async function resolveDingUserNameMap() {
  try {
    const res = await getDingUserList({})
    const payload = res?.data ?? res?.result ?? res
    const list = pickListFromResponse(payload)
    const map = {}

    for (const item of list) {
      const userId = item?.userId ?? item?.userid ?? item?.id
      const name = item?.name ?? item?.userName ?? item?.username ?? item?.nickName
      if (userId && name) {
        map[userId] = name
      }
    }

    return map
  } catch (error) {
    console.warn('[useApprovalDetailTimeline] getDingUserList failed:', error)
    return {}
  }
}

export { buildDingApprovalFlowWithHistories, buildTableData, buildDingApprovalFlow }

export function useApprovalDetailTimeline() {
  const dingUserListRef = ref({})
  const approvalTableData = ref([])

  const getApproverDisplay = (record) => record?.displayApprover || ''

  const getData = async (input) => {
    const nodeData = JSON.parse(JSON.stringify(input || {}))
    if (!nodeData || typeof nodeData !== 'object') {
      approvalTableData.value = []
      return
    }

    dingUserListRef.value = await resolveDingUserNameMap()
    approvalTableData.value = buildTableData(buildDingApprovalFlowWithHistories(nodeData, dingUserListRef.value))
  }

  return {
    approvalTableData,
    getApproverDisplay,
    getData,
  }
}
