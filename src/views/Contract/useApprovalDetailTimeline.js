import { ref } from 'vue'
import { getDingUserList } from '@/api/Contract/intention'

/**
 * 入口函数
 * input = 你现在传的完整数据
 * extraUserNameMap = 额外 userId => name 映射
 */
function buildDingApprovalFlowWithHistories(input, extraUserNameMap = {}) {
  const parts = []

  const currentBusinessId = input.processInstances?.businessId
  const histories = (input.processHistories || [])
    .filter((h) => {
      return h.businessId != currentBusinessId
    })
    .sort((a, b) => Number(a.id || 0) - Number(b.id || 0))

  // 1. 历史审批流放最前面
  histories.forEach((history, index) => {
    const historyInput = normalizeHistoryProcess(history)

    if (!historyInput.processInstances) {
      return
    }

    parts.push(`历史审批流 ${index + 1}`)
    parts.push(buildDingApprovalFlow(historyInput, extraUserNameMap))
  })

  // 2. 当前审批流放后面
  parts.push('当前审批流')
  parts.push(buildDingApprovalFlow(input, extraUserNameMap))

  return parts.join('\n\n').trim()
}

/**
 * 把 processHistories 里的数据转换成统一结构
 */
function normalizeHistoryProcess(history) {
  return {
    workflowForecastNodes: history?.forecastJson?.workflowForecastNodes || [],
    workflowActivityRules: history?.forecastJson?.workflowActivityRules || [],
    processInstances: history?.extJson || null,
  }
}

/**
 * 构建可直接渲染列表的记录数据，历史审批流在前，当前审批流在后。
 */
function buildDingApprovalFlowRecordsWithHistories(input, extraUserNameMap = {}) {
  const currentBusinessId = input.processInstances?.businessId
  const histories = (input.processHistories || [])
    .filter((h) => {
      return h.businessId != currentBusinessId
    })
    .sort((a, b) => Number(a.id || 0) - Number(b.id || 0))

  const records = []

  histories.forEach((history, index) => {
    const historyInput = normalizeHistoryProcess(history)

    if (!historyInput.processInstances) {
      return
    }

    records.push(...buildDingApprovalFlowRecords(historyInput, extraUserNameMap, {
      flowType: 'history',
      flowIndex: index + 1,
      flowLabel: `历史审批流 ${index + 1}`,
    }))
  })

  records.push(...buildDingApprovalFlowRecords(input, extraUserNameMap, {
    flowType: 'current',
    flowIndex: 0,
    flowLabel: '当前审批流',
  }))

  return records.map((record, index) => ({
    ...record,
    globalIndex: index + 1,
  }))
}

/**
 * 构建单个审批流的结构化记录列表。
 */
function buildDingApprovalFlowRecords(input, extraUserNameMap = {}, flowOptions = {}) {
  const workflowForecastNodes = input.workflowForecastNodes || []
  const workflowActivityRules = input.workflowActivityRules || []
  const instance = input.processInstances || {}

  const operationRecords = (instance.operationRecords || [])
    .slice()
    .sort((a, b) => toTime(a.date) - toTime(b.date))

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

    for (const task of appendTasks) {
      usedTaskIds.add(task.taskId)
      taskAppendTypeMap.set(task.taskId, record.type)
    }

    appendRelations.push({
      record,
      tasks: appendTasks,
    })
  }

  const flowMeta = createFlowMeta(instance, flowOptions)
  const records = []
  const pushRecord = (record) => {
    records.push(normalizeFlowRecord(record, flowMeta, records.length + 1))
  }

  for (const record of operationRecords) {
    if (record.type === 'START_PROCESS_INSTANCE') {
      pushRecord({
        category: 'start',
        recordType: record.type,
        title: '发起申请',
        status: 'COMPLETED',
        statusText: '已提交',
        result: record.result || '',
        resultText: '已提交',
        time: record.date || '',
        operator: createUser(record.userId, userNameMap),
        users: [createUser(record.userId, userNameMap, '', {
          status: 'COMPLETED',
          statusText: '已提交',
          result: record.result || '',
          resultText: '已提交',
          time: record.date || '',
        })],
      })
      continue
    }

    if (isAppendRecord(record)) {
      const relation = appendRelations.find(item => item.record === record)
      const appendTasks = relation ? relation.tasks : []
      const appendType = getAppendType(record.type)

      pushRecord({
        category: 'append',
        recordType: record.type,
        activityId: record.activityId || '',
        activityName: record.showName || '审批人',
        appendType,
        appendTypeText: getAppendTypeText(appendType),
        title: record.showName || '审批人',
        status: 'COMPLETED',
        statusText: '已加签',
        result: record.result || '',
        resultText: '已加签',
        time: record.date || '',
        operator: createUser(record.userId, userNameMap),
        users: [createUser(record.userId, userNameMap, '', {
          status: 'COMPLETED',
          statusText: '已加签',
          result: record.result || '',
          resultText: '已加签',
          time: record.date || '',
        })],
        addedUsers: appendTasks.map(task => createTaskUser(task, userNameMap)),
      })
      continue
    }

    if (shouldRenderProcessCc(record, workflowActivityRules)) {
      const ccUsers = (record.ccUserIds || []).map(userId => createUser(userId, userNameMap, '', {
        status: 'COMPLETED',
        statusText: '已抄送',
        result: record.result || '',
        resultText: '已抄送',
        time: record.date || '',
      }))

      pushRecord({
        category: 'cc',
        recordType: record.type,
        activityId: record.activityId || '',
        activityName: record.showName || '抄送人',
        title: record.showName || '抄送人',
        status: 'COMPLETED',
        statusText: '已抄送',
        result: record.result || '',
        resultText: '已抄送',
        time: record.date || '',
        operator: createUser(record.userId, userNameMap),
        users: ccUsers,
        ccUsers,
      })
      continue
    }

    if (record.type === 'EXECUTE_TASK_NORMAL') {
      const task = findExecuteTask(record, tasks)
      if (!task) continue

      if (isInGroupedAppendTask(task, appendRelations)) {
        continue
      }

      const appendRecordType = taskAppendTypeMap.get(task.taskId)
      const appendType = getAppendType(appendRecordType)
      const title = getApprovalRecordTitle('审批人', appendType)

      pushRecord({
        category: 'approval',
        recordType: record.type,
        activityId: task.activityId || record.activityId || '',
        activityName: record.showName || '审批人',
        appendType,
        appendTypeText: getAppendTypeText(appendType),
        title,
        status: task.status || '',
        statusText: getTaskStatusText(task),
        result: task.result || record.result || '',
        resultText: getResultText(task),
        time: task.finishTime || record.date || '',
        taskId: task.taskId || '',
        operator: createUser(record.userId, userNameMap),
        users: [createTaskUser(task, userNameMap)],
      })
    }
  }

  for (const relation of appendRelations) {
    if (!shouldRenderAppendGroup(relation)) continue

    pushRecord(createAppendGroupRecord(relation, userNameMap))
  }

  appendForecastUnfinishedRecords({
    pushRecord,
    workflowForecastNodes,
    workflowActivityRules,
    operationRecords,
    tasks,
    usedTaskIds,
    userNameMap,
  })

  return records
}

/**
 * 构建单个审批流
 */
function buildDingApprovalFlow(input, extraUserNameMap = {}) {
  const workflowForecastNodes = input.workflowForecastNodes || []
  const workflowActivityRules = input.workflowActivityRules || []
  const instance = input.processInstances || {}

  const operationRecords = (instance.operationRecords || [])
    .slice()
    .sort((a, b) => toTime(a.date) - toTime(b.date))

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

  // 1. 根据加签记录动态推导加签生成的任务
  for (const record of operationRecords) {
    if (!isAppendRecord(record)) continue

    const appendTasks = findAppendTasks(record, tasks, usedTaskIds)

    for (const task of appendTasks) {
      usedTaskIds.add(task.taskId)
      taskAppendTypeMap.set(task.taskId, record.type)
    }

    appendRelations.push({
      record,
      tasks: appendTasks,
    })
  }

  const lines = []

  lines.push(`流程：${instance.title || ''}`)
  lines.push(`业务单号：${instance.businessId || ''}`)
  lines.push(`状态：${instance.status || ''}`)

  // 2. 按操作记录输出已经发生的流程
  for (const record of operationRecords) {
    if (record.type === 'START_PROCESS_INSTANCE') {
      lines.push('发起申请')
      lines.push(`我 / ${getName(record.userId, userNameMap)}`)
      lines.push(`时间：${formatTime(record.date)}`)
      continue
    }

    if (isAppendRecord(record)) {
      const relation = appendRelations.find(item => item.record === record)
      const appendTasks = relation ? relation.tasks : []

      lines.push('审批人')
      lines.push(`${getName(record.userId, userNameMap)}（加签）`)
      lines.push(`时间：${formatTime(record.date)}`)

      if (appendTasks.length > 0) {
        lines.push(`添加审批人：${appendTasks.map(t => getName(t.userId, userNameMap)).join('、')}`)
      } else {
        lines.push('添加审批人：未识别')
      }

      continue
    }

    if (shouldRenderProcessCc(record, workflowActivityRules)) {
      renderProcessCc(lines, record, userNameMap)
      continue
    }

    if (record.type === 'EXECUTE_TASK_NORMAL') {
      const task = findExecuteTask(record, tasks)
      if (!task) continue

      // 或签/审批中组后面统一展示，不单独展示
      if (isInGroupedAppendTask(task, appendRelations)) {
        continue
      }

      const appendType = taskAppendTypeMap.get(task.taskId)

      let title = '审批人'
      if (appendType === 'APPEND_TASK_BEFORE') {
        title = '审批人（前加签）'
      }
      if (appendType === 'APPEND_TASK_AFTER') {
        title = '审批人（后加签）'
      }

      lines.push(title)
      lines.push(`${getName(task.userId, userNameMap)}（${getResultText(task)}）`)
      lines.push(`时间：${formatTime(task.finishTime || record.date)}`)
      lines.push(`taskId：${task.taskId}`)
    }
  }

  // 3. 输出加签产生的或签 / 当前审批中组
  for (const relation of appendRelations) {
    if (!shouldRenderAppendGroup(relation)) continue

    renderAppendGroup(lines, relation, userNameMap)
  }

  // 4. 输出原始审批流里未处理 / 未开始的节点
  renderForecastUnfinishedNodes({
    lines,
    workflowForecastNodes,
    workflowActivityRules,
    operationRecords,
    tasks,
    usedTaskIds,
    userNameMap,
  })

  return lines.join('\n').trim()
}

/**
 * 拼接 forecast 里的原始审批节点
 * 包含：
 * 1. 已生成 task 但未完成：PAUSED / NEW / RUNNING
 * 2. 还没生成 task 的后续节点：未开始
 */
function renderForecastUnfinishedNodes({
  lines,
  workflowForecastNodes,
  workflowActivityRules,
  operationRecords,
  tasks,
  usedTaskIds,
  userNameMap,
}) {
  const orderedRules = getRulesByForecastOrder(workflowForecastNodes, workflowActivityRules)

  for (const rule of orderedRules) {
    const activityId = rule.activityId
    const hasActivityRecord = operationRecords.some(record => record.activityId === activityId)

    if (isNotifierRule(rule)) {
      if (!hasActivityRecord) {
        renderNotStartedCcNode(lines, rule, userNameMap)
      }
      continue
    }

    const nodeTasks = tasks.filter(task => {
      if (task.activityId !== activityId) return false
      if (usedTaskIds.has(task.taskId)) return false

      return ['PAUSED', 'NEW', 'RUNNING'].includes(task.status)
    })

    if (nodeTasks.length > 0) {
      renderGeneratedOriginalNode(lines, rule, nodeTasks, userNameMap)
      continue
    }

    const hasAnyTask = tasks.some(task => task.activityId === activityId)

    if (!hasAnyTask && !hasActivityRecord) {
      renderNotStartedOriginalNode(lines, rule, userNameMap)
    }
  }
}

function shouldRenderProcessCc(record, workflowActivityRules) {
  if (record.type !== 'PROCESS_CC') return false

  const rule = getRuleByActivityId(workflowActivityRules, record.activityId)

  return isNotifierRule(rule) || record.showName === '抄送人'
}

function renderProcessCc(lines, record, userNameMap) {
  const ccUserIds = record.ccUserIds || []
  const ccNames = ccUserIds.map(userId => getName(userId, userNameMap))

  lines.push(record.showName || '抄送人')
  lines.push(`${ccNames.join('、') || '未识别'}（已抄送）`)
  lines.push(`时间：${formatTime(record.date)}`)
}

function renderNotStartedCcNode(lines, rule, userNameMap) {
  const actioners = rule.activityActioners || []
  const activityName = rule.activityName || '抄送人'

  lines.push(activityName)
  lines.push('抄送人：')

  for (const user of actioners) {
    lines.push(`- ${getName(user.userId, userNameMap, user.name)}：未开始`)
  }

  lines.push('')
}

function appendForecastUnfinishedRecords({
  pushRecord,
  workflowForecastNodes,
  workflowActivityRules,
  operationRecords,
  tasks,
  usedTaskIds,
  userNameMap,
}) {
  const orderedRules = getRulesByForecastOrder(workflowForecastNodes, workflowActivityRules)

  for (const rule of orderedRules) {
    const activityId = rule.activityId
    const hasActivityRecord = operationRecords.some(record => record.activityId === activityId)

    if (isNotifierRule(rule)) {
      if (!hasActivityRecord) {
        pushRecord(createNotStartedCcRecord(rule, userNameMap))
      }
      continue
    }

    const nodeTasks = tasks.filter(task => {
      if (task.activityId !== activityId) return false
      if (usedTaskIds.has(task.taskId)) return false

      return ['PAUSED', 'NEW', 'RUNNING'].includes(task.status)
    })

    if (nodeTasks.length > 0) {
      pushRecord(createGeneratedOriginalNodeRecord(rule, nodeTasks, userNameMap))
      continue
    }

    const hasAnyTask = tasks.some(task => task.activityId === activityId)

    if (!hasAnyTask && !hasActivityRecord) {
      pushRecord(createNotStartedOriginalNodeRecord(rule, userNameMap))
    }
  }
}

function createFlowMeta(instance, flowOptions) {
  return {
    flowType: flowOptions.flowType || 'current',
    flowIndex: flowOptions.flowIndex ?? 0,
    flowLabel: flowOptions.flowLabel || '当前审批流',
    flowTitle: instance.title || '',
    businessId: instance.businessId || '',
    flowStatus: instance.status || '',
  }
}

function normalizeFlowRecord(record, flowMeta, sequence) {
  const time = record.time || ''

  return {
    id: record.id || `${flowMeta.flowType}-${flowMeta.businessId || 'unknown'}-${sequence}`,
    sequence,
    globalIndex: 0,
    flowType: flowMeta.flowType,
    flowIndex: flowMeta.flowIndex,
    flowLabel: flowMeta.flowLabel,
    flowTitle: flowMeta.flowTitle,
    businessId: flowMeta.businessId,
    flowStatus: flowMeta.flowStatus,
    category: record.category || '',
    recordType: record.recordType || '',
    activityId: record.activityId || '',
    activityName: record.activityName || '',
    approvalMethod: record.approvalMethod || '',
    approvalMethodText: record.approvalMethodText || '',
    appendType: record.appendType || '',
    appendTypeText: record.appendTypeText || '',
    title: record.title || '',
    description: record.description || '',
    status: record.status || '',
    statusText: record.statusText || '',
    result: record.result || '',
    resultText: record.resultText || '',
    time,
    timeText: record.timeText || formatTime(time),
    taskId: normalizeId(record.taskId),
    operator: normalizeUser(record.operator),
    users: (record.users || []).map(normalizeUser),
    addedUsers: (record.addedUsers || []).map(normalizeUser),
    ccUsers: (record.ccUsers || []).map(normalizeUser),
  }
}

function normalizeUser(user = {}) {
  const time = user.time || ''

  return {
    userId: user.userId || '',
    name: user.name || user.userId || '',
    status: user.status || '',
    statusText: user.statusText || '',
    result: user.result || '',
    resultText: user.resultText || '',
    time,
    timeText: user.timeText || formatTime(time),
    taskId: normalizeId(user.taskId),
  }
}

function normalizeId(value) {
  if (value === undefined || value === null) return ''

  return String(value)
}

function createUser(userId, userNameMap, defaultName = '', extra = {}) {
  return {
    userId: userId || '',
    name: userId ? getName(userId, userNameMap, defaultName) : defaultName,
    ...extra,
  }
}

function createTaskUser(task, userNameMap) {
  return createUser(task.userId, userNameMap, '', {
    status: task.status || '',
    statusText: getTaskStatusText(task),
    result: task.result || '',
    resultText: getResultText(task),
    time: task.finishTime || task.createTime || '',
    taskId: task.taskId || '',
  })
}

function createActionerUser(user, userNameMap, status = 'NOT_STARTED', statusText = '未开始') {
  return createUser(user.userId, userNameMap, user.name, {
    status,
    statusText,
    result: '',
    resultText: statusText,
  })
}

function createAppendGroupRecord(relation, userNameMap) {
  const tasks = relation.tasks || []
  const hasRunning = tasks.some(task => task.status === 'RUNNING')
  const appendType = getAppendType(relation.record.type)
  const appendTypeText = getAppendTypeText(appendType)
  const title = hasRunning && tasks.length === 1
    ? '审批人 或签'
    : `审批人（${appendTypeText}） 或签`

  return {
    category: 'append_group',
    recordType: relation.record.type,
    activityId: relation.record.activityId || '',
    activityName: relation.record.showName || '审批人',
    approvalMethod: 'OR',
    approvalMethodText: '或签',
    appendType,
    appendTypeText,
    title,
    description: hasRunning && tasks.length === 1
      ? '当前已生成任务'
      : `${tasks.length}人审批中，1人同意即可通过`,
    status: hasRunning ? 'RUNNING' : 'COMPLETED',
    statusText: hasRunning ? '审批中' : '已处理',
    result: '',
    resultText: hasRunning ? '审批中' : '已处理',
    time: relation.record.date || '',
    operator: createUser(relation.record.userId, userNameMap),
    users: tasks.map(task => createTaskUser(task, userNameMap)),
  }
}

function createGeneratedOriginalNodeRecord(rule, nodeTasks, userNameMap) {
  const method = getApprovalMethod(rule)
  const activityName = rule.activityName || '审批人'

  return {
    category: 'pending_approval',
    recordType: 'GENERATED_TASK',
    activityId: rule.activityId || '',
    activityName,
    approvalMethod: method,
    approvalMethodText: getApprovalMethodText(method),
    title: getApprovalRecordTitle(activityName, '', method),
    description: getApprovalDescription(method, nodeTasks.length, true),
    status: nodeTasks.some(task => task.status === 'RUNNING') ? 'RUNNING' : 'PENDING',
    statusText: nodeTasks.some(task => task.status === 'RUNNING') ? '审批中' : '未处理',
    result: '',
    resultText: nodeTasks.some(task => task.status === 'RUNNING') ? '审批中' : '未处理',
    users: nodeTasks.map(task => createTaskUser(task, userNameMap)),
  }
}

function createNotStartedOriginalNodeRecord(rule, userNameMap) {
  const actioners = rule.activityActioners || []
  const method = getApprovalMethod(rule)
  const activityName = rule.activityName || '审批人'

  return {
    category: 'not_started_approval',
    recordType: 'NOT_STARTED',
    activityId: rule.activityId || '',
    activityName,
    approvalMethod: method,
    approvalMethodText: getApprovalMethodText(method),
    title: getApprovalRecordTitle(activityName, '', method),
    description: getApprovalDescription(method, actioners.length, false),
    status: 'NOT_STARTED',
    statusText: '未开始',
    result: '',
    resultText: '未开始',
    users: actioners.map(user => createActionerUser(user, userNameMap)),
  }
}

function createNotStartedCcRecord(rule, userNameMap) {
  const actioners = rule.activityActioners || []
  const activityName = rule.activityName || '抄送人'

  return {
    category: 'cc',
    recordType: 'NOT_STARTED_CC',
    activityId: rule.activityId || '',
    activityName,
    title: activityName,
    description: `${actioners.length}人未抄送`,
    status: 'NOT_STARTED',
    statusText: '未开始',
    result: '',
    resultText: '未开始',
    users: actioners.map(user => createActionerUser(user, userNameMap)),
    ccUsers: actioners.map(user => createActionerUser(user, userNameMap)),
  }
}

/**
 * 已生成但未完成的原始节点
 */
function renderGeneratedOriginalNode(lines, rule, nodeTasks, userNameMap) {
  const method = getApprovalMethod(rule)

  if (method === 'ONE_BY_ONE') {
    lines.push('审批人 依次审批')
    lines.push(`${nodeTasks.length}人依次审批`)
    lines.push('')
    lines.push('审批顺序：')
    lines.push(nodeTasks.map(task => getName(task.userId, userNameMap)).join(' -> '))
    lines.push('')
    lines.push('当前任务：')

    for (const task of nodeTasks) {
      lines.push(`- ${getName(task.userId, userNameMap)}：${getTaskStatusText(task)}`)
      lines.push(`  taskId：${task.taskId}`)
      lines.push('')
    }

    return
  }

  if (method === 'OR') {
    lines.push('审批人 或签')
    lines.push(`${nodeTasks.length}人审批中，1人同意即可通过`)
    lines.push('')
    lines.push('当前任务：')

    for (const task of nodeTasks) {
      lines.push(`- ${getName(task.userId, userNameMap)}：${getTaskStatusText(task)}`)
      lines.push(`  taskId：${task.taskId}`)
      lines.push(`  status：${task.status}`)
      lines.push('')
    }

    return
  }

  lines.push('审批人 会签')
  lines.push(`${nodeTasks.length}人审批，需要全部处理`)
  lines.push('')
  lines.push('当前任务：')

  for (const task of nodeTasks) {
    lines.push(`- ${getName(task.userId, userNameMap)}：${getTaskStatusText(task)}`)
    lines.push(`  taskId：${task.taskId}`)
    lines.push(`  status：${task.status}`)
    lines.push('')
  }
}

/**
 * 还没生成 task 的原始后续节点
 */
function renderNotStartedOriginalNode(lines, rule, userNameMap) {
  const actioners = rule.activityActioners || []
  const method = getApprovalMethod(rule)
  const activityName = rule.activityName || '审批人'

  if (method === 'ONE_BY_ONE') {
    lines.push(`${activityName} 依次审批`)
    lines.push(`${actioners.length}人依次审批`)
    lines.push('')
    lines.push('审批顺序：')
    lines.push(actioners.map(user => getName(user.userId, userNameMap, user.name)).join(' -> '))
    lines.push('')
    lines.push('当前任务：')

    for (const user of actioners) {
      lines.push(`- ${getName(user.userId, userNameMap, user.name)}：未开始`)
    }

    lines.push('')
    return
  }

  if (method === 'OR') {
    lines.push(`${activityName} 或签`)
    lines.push(`${actioners.length}人审批中，1人同意即可通过`)
    lines.push('')
    lines.push('审批人：')

    for (const user of actioners) {
      lines.push(`- ${getName(user.userId, userNameMap, user.name)}：未开始`)
    }

    lines.push('')
    return
  }

  lines.push(`${activityName} 会签`)
  lines.push(`${actioners.length}人审批，需要全部处理`)
  lines.push('')
  lines.push('审批人：')

  for (const user of actioners) {
    lines.push(`- ${getName(user.userId, userNameMap, user.name)}：未开始`)
  }

  lines.push('')
}

/**
 * 根据 workflowForecastNodes 排原始节点顺序
 */
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

function getRuleByActivityId(workflowActivityRules, activityId) {
  return (workflowActivityRules || []).find(rule => rule.activityId === activityId)
}

function isNotifierRule(rule) {
  return rule?.workflowActor?.actorType === 'notifier'
}

/**
 * 根据一次加签操作，动态找出本次加签生成的 tasks
 */
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

    /**
     * 同一时间可能包含：
     * - 原始节点任务：PAUSED / NEW
     * - 加签生成任务：COMPLETED / RUNNING / CANCELED
     *
     * 优先取 COMPLETED / RUNNING / CANCELED
     */
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

/**
 * 同一个 userId 同一组里可能有多个 task，取优先级高的
 */
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

/**
 * 是否需要把加签任务作为组展示
 */
function shouldRenderAppendGroup(relation) {
  const tasks = relation.tasks || []
  if (tasks.length === 0) return false

  const hasCanceled = tasks.some(task => task.status === 'CANCELED')
  const hasRunning = tasks.some(task => task.status === 'RUNNING')

  if (tasks.length > 1 && hasCanceled) return true
  if (hasRunning) return true

  return false
}

/**
 * 渲染加签组
 */
function renderAppendGroup(lines, relation, userNameMap) {
  const tasks = relation.tasks || []
  const hasRunning = tasks.some(task => task.status === 'RUNNING')

  if (hasRunning && tasks.length === 1) {
    lines.push('审批人 或签')
    lines.push('当前已生成任务：')
    lines.push('')
  } else {
    const appendTypeName = relation.record.type === 'APPEND_TASK_BEFORE' ? '前加签' : '后加签'

    lines.push(`审批人（${appendTypeName}） 或签`)
    lines.push(`${tasks.length}人审批中，1人同意即可通过`)
    lines.push('')
    lines.push('审批人：')
  }

  for (const task of tasks) {
    lines.push(`- ${getName(task.userId, userNameMap)}：${getTaskStatusText(task)}`)
    lines.push(`  taskId：${task.taskId}`)

    if (task.status === 'RUNNING') {
      lines.push(`  status：${task.status}`)
    }

    lines.push('')
  }
}

/**
 * 判断这个 task 是否属于后面统一展示的加签组
 */
function isInGroupedAppendTask(task, appendRelations) {
  return appendRelations.some(relation => {
    if (!shouldRenderAppendGroup(relation)) return false

    return relation.tasks.some(item => item.taskId === task.taskId)
  })
}

/**
 * 根据执行记录找对应 task
 */
function findExecuteTask(record, tasks) {
  return tasks.find(task => {
    return task.userId === record.userId
      && task.activityId === record.activityId
      && task.result === record.result
      && task.finishTime
      && formatTime(task.finishTime) === formatTime(record.date)
  })
}

/**
 * 构建 userId => name
 */
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

  // 没名字的兜底用 userId
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

function getAppendType(recordType) {
  if (recordType === 'APPEND_TASK_BEFORE') return 'before'
  if (recordType === 'APPEND_TASK_AFTER') return 'after'

  return ''
}

function getAppendTypeText(appendType) {
  if (appendType === 'before') return '前加签'
  if (appendType === 'after') return '后加签'

  return ''
}

function getApprovalRecordTitle(activityName, appendType = '', method = '') {
  const appendTypeText = getAppendTypeText(appendType)

  if (appendTypeText) {
    return `${activityName}（${appendTypeText}）`
  }

  if (method) {
    return `${activityName} ${getApprovalMethodText(method)}`
  }

  return activityName
}

function getApprovalDescription(method, count, generated) {
  if (method === 'ONE_BY_ONE') {
    return `${count}人依次审批`
  }

  if (method === 'OR') {
    return generated
      ? `${count}人审批中，1人同意即可通过`
      : `${count}人或签，1人同意即可通过`
  }

  return generated
    ? `${count}人审批，需要全部处理`
    : `${count}人会签，需要全部处理`
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

/**
 * 不做时区转换，直接按钉钉返回值展示
 * 2026-06-12T09:31Z => 06-12 09:31
 */
function formatTime(value) {
  if (!value) return ''
  return `${value.slice(5, 10)} ${value.slice(11, 16)}`
}

function shouldShowOperateDate(statusCode) {
  return statusCode !== 0 && statusCode !== 1
}

function resolveStatusCode(record) {
  if (record.status === 'RUNNING') return 1

  const hasRefuse = record.result === 'REFUSE'
    || (record.users || []).some(user => user.result === 'REFUSE')
  if (hasRefuse) return 3

  const isCompleted = record.status === 'COMPLETED'
    || record.result === 'AGREE'
    || (record.users || []).some(user => user.result === 'AGREE')
  if (isCompleted) return 2

  return 0
}

function formatUserDisplay(user) {
  const statusText = user.resultText || user.statusText || ''
  if (!statusText) return user.name || ''
  return `${user.name || ''}（${statusText}）`
}

function getRecordDisplayApprover(record) {
  if (record.category === 'append') {
    const operatorName = record.operator?.name || ''
    const added = (record.addedUsers || []).map(user => user.name).filter(Boolean).join('、') || '未识别'
    return `${operatorName}（加签）添加审批人：${added}`
  }

  if (record.category === 'start') {
    return record.operator?.name || ''
  }

  const users = record.users || []
  if (users.length > 0) {
    return users.map(formatUserDisplay).join('、')
  }

  if (record.operator?.name) {
    return record.operator.name
  }

  return record.description || '-'
}

function buildTableData(records = []) {
  return (records || []).map((record, index) => {
    const statusCode = resolveStatusCode(record)
    const showDate = shouldShowOperateDate(statusCode)
    const dateValue = record.time || ''

    return {
      id: `approval-row-${index + 1}`,
      section: record.flowType || 'current',
      displayApprover: getRecordDisplayApprover(record),
      status: record.title || record.activityName || '-',
      remark: record.resultText || '-',
      date: showDate ? dateValue : '',
      displayDate: showDate ? formatTime(dateValue) : '',
      statusCode,
      sourceRecord: record,
    }
  })
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

export {
  buildDingApprovalFlowWithHistories,
  buildDingApprovalFlow,
  buildDingApprovalFlowRecordsWithHistories,
  buildDingApprovalFlowRecords,
  normalizeHistoryProcess,
  buildTableData,
}

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

    const records = buildDingApprovalFlowRecordsWithHistories(nodeData, dingUserListRef.value)
    console.log('[useApprovalDetailTimeline] records JSON:\n', JSON.stringify(records, null, 2))

    approvalTableData.value = buildTableData(records)
  }

  return {
    approvalTableData,
    getApproverDisplay,
    getData,
  }
}
