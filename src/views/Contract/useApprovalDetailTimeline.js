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

    const appendTasks = findAppendTasks(record, tasks, usedTaskIds, operationRecords)
    const groupTasks = refineAppendGroupTasks(
      { record, tasks: appendTasks },
      operationRecords,
      tasks,
    )

    for (const task of appendTasks) {
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
      const appendTasks = relation ? relation.tasks : []

      items.push(createRecordItem({
        section,
        id: record.id,
        status: record.showName || '审批人',
        displayApprover: formatAppendRecordDisplay(record, appendTasks, userNameMap, operationRecords),
        date: record.date,
        remark: record.remark || '',
        statusCode: 2,
      }))

      continue
    }

    if (record.type === 'PROCESS_CC') {
      items.push(createProcessCcRecordItem(record, userNameMap, section))
      continue
    }

    if (record.type === 'REDIRECT_TASK') {
      items.push(createRedirectTaskRecordItem(record, tasks, userNameMap, section))
      continue
    }

    if (record.type === 'REDIRECT_PROCESS') {
      items.push(createRedirectProcessRecordItem(record, userNameMap, section))
      continue
    }

    if (record.type === 'EXECUTE_TASK_NORMAL') {
      const task = findExecuteTask(record, tasks)
      const appendType = task ? taskAppendTypeMap.get(task.taskId) : ''

      items.push(createRecordItem({
        section,
        id: record.id || task?.taskId,
        status: getApprovalStatusName(record.showName, appendType),
        displayApprover: task ? formatExecuteTaskDisplay(task, userNameMap) : formatOperationRecordDisplay(record, userNameMap),
        date: task?.finishTime || record.date,
        remark: record.remark || '',
        statusCode: getOperationRecordStatusCode(record, task),
      }))
      continue
    }

    items.push(createOperationRecordItem(record, userNameMap, section))
  }

  if (section === 'current') {
    for (const relation of appendRelations) {
      if (!shouldRenderAppendGroup(relation)) continue

      renderAppendGroup(items, relation, userNameMap, section)
    }
  }

  if (section === 'current' && instance.status === 'RUNNING') {
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

function getApprovalStatusName(showName = '审批人', appendType = '') {
  const appendTypeText = getAppendTypeText(appendType)

  return appendTypeText ? `${showName}（${appendTypeText}）` : showName
}

function formatExecuteTaskDisplay(task, userNameMap) {
  return `${getName(task.userId, userNameMap)}（${getResultText(task)}）`
}

function formatAppendRecordDisplay(record, appendTasks, userNameMap, operationRecords) {
  const operatorName = getName(record.userId, userNameMap)
  const appendTypeText = getAppendTypeText(record.type)
  const displayTasks = getDisplayTasks(appendTasks, record.userId)
  const fallbackUserId = getNextAppendOperatorUserId(record, operationRecords)
  const appendNames = displayTasks.length > 0
    ? displayTasks.map(task => getName(task.userId, userNameMap)).join('、')
    : getName(fallbackUserId, userNameMap, '未识别')

  return `${operatorName} ${appendTypeText}：${appendNames}`
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

function createRedirectTaskRecordItem(record, tasks, userNameMap, section) {
  return createRecordItem({
    section,
    id: record.id || `${record.type}-${record.activityId || ''}-${record.date || ''}`,
    status: record.showName || '审批人',
    displayApprover: formatRedirectTaskDisplay(record, tasks, userNameMap),
    date: record.date,
    remark: record.remark || '',
    statusCode: 2,
  })
}

function createRedirectProcessRecordItem(record, userNameMap, section) {
  return createRecordItem({
    section,
    id: record.id || `${record.type}-${record.activityId || ''}-${record.date || ''}`,
    status: record.showName || '审批人',
    displayApprover: formatRedirectProcessDisplay(record, userNameMap),
    date: record.date,
    remark: record.remark || '',
    statusCode: getOperationRecordStatusCode(record),
  })
}

function formatRedirectTaskDisplay(record, tasks, userNameMap) {
  const operatorName = getName(record.userId, userNameMap, '未识别')
  const targetTask = getRedirectTargetTask(record, tasks)
  const targetName = getRedirectTargetName(targetTask, userNameMap)

  if (!targetName) {
    return `${operatorName} 已转交`
  }

  return `${operatorName} 转交 ${targetName}`
}

function formatRedirectProcessDisplay(record, userNameMap) {
  const operatorName = getName(record.userId, userNameMap, '未识别')
  const typeName = record.showName || record.type || '审批人'

  return `${operatorName} 退回 ${typeName}`
}

function getRedirectTargetTask(record, tasks) {
  const candidates = (tasks || []).filter(task => {
    if (task.activityId !== record.activityId) return false
    if (task.userId === record.userId) return false

    return formatTime(task.createTime) === formatTime(record.date)
  })

  return candidates.find(task => task.status !== 'CANCELED')
    || candidates[0]
    || null
}

function getRedirectTargetName(task, userNameMap) {
  const userId = task?.userId
  if (!userId || isPlaceholderUserId(userId)) return ''

  const name = userNameMap[userId]
  if (!name || name === userId) return ''

  return name
}

function isPlaceholderUserId(userId) {
  return String(userId || '').startsWith('V00_')
}

function createOperationRecordItem(record, userNameMap, section) {
  return createRecordItem({
    section,
    id: record.id || `${record.type || 'operation'}-${record.activityId || ''}-${record.date || ''}`,
    status: record.showName || record.type || '审批人',
    displayApprover: formatOperationRecordDisplay(record, userNameMap),
    date: record.date,
    remark: record.remark || '',
    statusCode: getOperationRecordStatusCode(record),
  })
}

function formatOperationRecordDisplay(record, userNameMap) {
  return getName(record.userId, userNameMap, '未识别')
}

function getOperationRecordStatusCode(record, task) {
  const result = task?.result || record?.result
  return result === 'REFUSE' ? 3 : 2
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

    const nodeTasks = normalizePendingNodeTasks(tasks.filter(task => {
      if (task.activityId !== activityId) return false
      if (usedTaskIds.has(task.taskId)) return false

      return ['PAUSED', 'NEW', 'RUNNING'].includes(task.status)
    }))

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

function formatTaskUsersWithResult(tasks, userNameMap, method) {
  const displayTasks = getDisplayTasks(tasks)
  const displayNames = displayTasks
    .map(task => `${getName(task.userId, userNameMap)}（${getResultText(task)}）`)
    .join('、') || '未识别'

  if (displayTasks.length <= 1) return displayNames

  return `${displayNames} ${getApprovalMethodText(method)}`
}

function formatAppendGroupUsers(tasks, userNameMap, method, statusCode) {
  const displayNames = (tasks || [])
    .map(task => getName(task.userId, userNameMap))
    .join('、') || '未识别'
  const methodText = (tasks || []).length > 1 ? ` ${getApprovalMethodText(method)}` : ''

  if (statusCode === 1) {
    return `${displayNames}（审批中）${methodText}`
  }

  return formatTaskUsersWithResult(tasks, userNameMap, method)
}

function getDisplayTasks(tasks, excludeUserId = '') {
  return (tasks || []).filter(task => {
    if (isCanceledPlaceholderTask(task)) return false
    if (excludeUserId && task.userId === excludeUserId) return false

    return true
  })
}

function isCanceledPlaceholderTask(task) {
  return task?.status === 'CANCELED' && String(task.userId || '').startsWith('V00_')
}

function getNextAppendOperatorUserId(record, operationRecords) {
  const recordTime = toTime(record.date)
  const nextAppendRecord = (operationRecords || [])
    .filter(item => {
      if (!isAppendRecord(item)) return false
      if (item.activityId !== record.activityId) return false
      if (item.userId === record.userId) return false
      return toTime(item.date) > recordTime
    })
    .sort((a, b) => toTime(a.date) - toTime(b.date))[0]

  return nextAppendRecord?.userId || ''
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

function findAppendTasks(record, tasks, usedTaskIds, operationRecords = []) {
  const recordTime = toTime(record.date)
  const upperRecord = getNextSameActivityRecord(record, operationRecords)
  const upperTime = toTime(upperRecord?.date)

  const candidates = tasks.filter(task => {
    if (usedTaskIds.has(task.taskId)) return false
    if (task.activityId !== record.activityId) return false
    const createTime = toTime(task.createTime)
    if (createTime < recordTime) return false
    if (upperTime && isAppendRecord(upperRecord) && createTime >= upperTime) return false
    if (upperTime && !isAppendRecord(upperRecord) && createTime > upperTime) return false

    return true
  })

  if (candidates.length === 0) return []

  const realCandidates = dedupeUserTasks(candidates.filter(task => {
    return ['COMPLETED', 'RUNNING', 'CANCELED'].includes(task.status)
  }))
  if (realCandidates.length > 0) return realCandidates

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

function getNextSameActivityRecord(record, operationRecords) {
  const recordTime = toTime(record.date)

  return (operationRecords || [])
    .filter(item => {
      if (item === record) return false
      if (item.activityId !== record.activityId) return false
      return toTime(item.date) > recordTime
    })
    .sort((a, b) => toTime(a.date) - toTime(b.date))[0]
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

function normalizePendingNodeTasks(tasks) {
  const runningTasks = (tasks || []).filter(task => task.status === 'RUNNING')
  if (runningTasks.length > 0) return dedupePendingTasks(runningTasks)

  return dedupePendingTasks(tasks)
}

function dedupePendingTasks(tasks) {
  const map = new Map()

  for (const task of tasks || []) {
    const old = map.get(task.userId)
    if (!old || comparePendingTask(task, old) < 0) {
      map.set(task.userId, task)
    }
  }

  return Array.from(map.values())
    .sort((a, b) => {
      return toTime(a.createTime) - toTime(b.createTime)
        || Number(a.taskId || 0) - Number(b.taskId || 0)
    })
}

function comparePendingTask(a, b) {
  const priorityDiff = getPendingTaskPriority(a) - getPendingTaskPriority(b)
  if (priorityDiff !== 0) return priorityDiff

  return toTime(b.createTime) - toTime(a.createTime)
    || Number(b.taskId || 0) - Number(a.taskId || 0)
}

function getPendingTaskPriority(task) {
  const map = {
    RUNNING: 1,
    NEW: 2,
    PAUSED: 3,
  }

  return map[task.status] || 99
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
    return appendTasks.filter(task => {
      return task.status !== 'RUNNING'
    })
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
  const tasks = relation.tasks || []
  if (tasks.length === 0) return false

  return getDisplayTasks(tasks).some(task => {
    return ['RUNNING', 'NEW', 'PAUSED'].includes(task.status)
  })
}

function renderAppendGroup(items, relation, userNameMap, section) {
  const tasks = getAppendPendingTasks(relation.tasks)
  const status = getApprovalStatusName(relation.record.showName, relation.record.type)

  const displayTasks = getDisplayTasks(tasks)
  const statusCode = resolveAppendGroupStatusCode(displayTasks)
  const displayApprover = formatAppendGroupUsers(displayTasks, userNameMap, 'ALL', statusCode)

  items.push(createRecordItem({
    section,
    id: `append-${relation.record.id || relation.record.activityId}`,
    status,
    displayApprover,
    date: getAppendGroupOperateDate(displayTasks, statusCode),
    remark: '',
    statusCode,
  }))
}

function getAppendPendingTasks(tasks) {
  const runningTasks = (tasks || []).filter(task => task.status === 'RUNNING')
  if (runningTasks.length > 0) return runningTasks

  return (tasks || []).filter(task => ['NEW', 'PAUSED'].includes(task.status))
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
  if (tasks.some(task => ['NEW', 'PAUSED'].includes(task.status))) return 0
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
