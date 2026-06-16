import { ref } from 'vue';
import { getDingUserList } from '@/api/Contract/intention';

const APPROVAL_METHOD_TEXT = {
  AND: '会签',
  ONE_BY_ONE: '依次审批',
  OR: '或签',
};

const APPEND_ACTION_TEXT = {
  APPEND_TASK_BEFORE: '前加签审批',
  APPEND_TASK_AFTER: '后加签审批',
};

const PLACEHOLDER_USER_NAME = '系统';

const CC_NODE_NAME = '抄送人';

function isCcRule(rule) {
  return rule?.activityName === CC_NODE_NAME || rule?.activityType === 'target_select';
}

/**
 * 入口函数
 * input = 你现在传的完整数据
 * extraUserNameMap = 额外 userId => name 映射
 */
function buildDingApprovalFlowWithHistories(input, extraUserNameMap = {}) {
  const historyFlows = [];

  const currentBusinessId = input.processInstances?.businessId;
  const histories = (input.processHistories || [])
    .slice()
    .filter((h) => {
      if (currentBusinessId == null || currentBusinessId === '') return true;
      const historyBusinessId = h.businessId ?? h.dingProcessBusinessId;
      return historyBusinessId != currentBusinessId;
    })
    .sort((a, b) => Number(a.id || 0) - Number(b.id || 0));

  histories.forEach((history, index) => {
    const historyInput = normalizeHistoryProcess(history);

    if (!historyInput.processInstances) {
      return;
    }

    historyFlows.push({
      section: 'history',
      historyIndex: index + 1,
      historyRowId: history.id,
      historyBusinessId: history.businessId ?? history.dingProcessBusinessId,
      ...buildDingApprovalFlow(historyInput, extraUserNameMap),
    });
  });

  return {
    historyFlows,
    current: {
      section: 'current',
      ...buildDingApprovalFlow(input, extraUserNameMap),
    },
  };
}

/**
 * 把 processHistories 里的数据转换成统一结构
 */
function normalizeHistoryProcess(history) {
  return {
    workflowForecastNodes: history?.forecastJson?.workflowForecastNodes || [],
    workflowActivityRules: history?.forecastJson?.workflowActivityRules || [],
    processInstances: history?.extJson || null,
  };
}

/**
 * 构建单个审批流
 */
function buildDingApprovalFlow(input, extraUserNameMap = {}) {
  const workflowForecastNodes = input.workflowForecastNodes || [];
  const workflowActivityRules = input.workflowActivityRules || [];
  const ruleMap = buildRuleMap(workflowActivityRules);
  const instance = input.processInstances || {};

  const operationRecords = (instance.operationRecords || [])
    .slice()
    .sort((a, b) => toTime(a.date) - toTime(b.date));

  const tasks = (instance.tasks || [])
    .slice()
    .sort((a, b) => {
      return toTime(a.createTime) - toTime(b.createTime)
        || Number(a.taskId || 0) - Number(b.taskId || 0);
    });

  const userNameMap = buildUserNameMap({
    workflowActivityRules,
    tasks,
    operationRecords,
    extraUserNameMap,
  });

  const usedTaskIds = new Set();
  const taskAppendTypeMap = new Map();
  const appendRelations = [];

  // 1. 根据加签记录动态推导加签生成的任务
  for (const record of operationRecords) {
    if (!isAppendRecord(record)) continue;

    const appendTasks = findAppendTasks(record, tasks, usedTaskIds);

    for (const task of appendTasks) {
      usedTaskIds.add(task.taskId);
      taskAppendTypeMap.set(task.taskId, record.type);
    }

    appendRelations.push({
      record,
      tasks: appendTasks,
    });
  }

  const items = [];
  const ccCompletedActivityIds = new Set(
    operationRecords
      .filter(record => record.type === 'PROCESS_CC' && record.activityId)
      .map(record => record.activityId),
  );

  // 2. 按操作记录输出已经发生的流程
  for (const record of operationRecords) {
    if (record.type === 'START_PROCESS_INSTANCE') {
      items.push(createNodeItem({
        kind: 'start_process',
        recordType: record.type,
        nodeName: record.showName || '发起申请',
        nodeData: `${getName(record.userId, userNameMap)}`,
        date: record.date,
        remark: record.remark || '',
        statusCode: 2,
      }));
      continue;
    }

    if (record.type === 'PROCESS_CC') {
      items.push(createNodeItem({
        kind: 'process_cc',
        recordType: record.type,
        activityId: record.activityId,
        nodeName: CC_NODE_NAME,
        nodeData: formatCcNodeData(record, userNameMap),
        date: record.date,
        remark: record.remark || '',
        statusCode: 2,
      }));
      continue;
    }

    if (record.type === 'REDIRECT_TASK') {
      items.push(createNodeItem({
        kind: 'redirect_task',
        recordType: record.type,
        activityId: record.activityId,
        nodeName: record.showName || '审批人',
        nodeData: formatRedirectNodeData(record, tasks, userNameMap),
        date: record.date,
        remark: record.remark || '',
        statusCode: 2,
      }));
      continue;
    }

    if (isAppendRecord(record)) {
      const relation = appendRelations.find(item => item.record === record);
      const appendTasks = relation ? relation.tasks : [];

      items.push(createNodeItem({
        kind: 'append_record',
        recordType: record.type,
        activityId: record.activityId,
        nodeName: record.showName || '审批人',
        nodeData: formatAppendRecordNodeData(record, appendTasks, userNameMap),
        date: record.date,
        remark: record.remark || '',
        statusCode: 2,
      }));

      continue;
    }

    if (record.type === 'EXECUTE_TASK_NORMAL') {
      const task = findExecuteTask(record, tasks);
      if (!task) continue;

      // 或签/审批中组后面统一展示，不单独展示
      if (isInGroupedAppendTask(task, appendRelations)) {
        continue;
      }

      items.push(createNodeItem({
        kind: 'execute_task',
        recordType: record.type,
        activityId: record.activityId,
        nodeName: record.showName || '审批人',
        nodeData: formatPersonNodeData(getName(task.userId, userNameMap), task),
        date: task.finishTime || record.date,
        remark: record.remark || '',
        statusCode: task.result === 'REFUSE' ? 3 : 2,
        taskId: task.taskId,
      }));
    }
  }

  // 3. 输出加签产生的或签 / 当前审批中组
  for (const relation of appendRelations) {
    if (!shouldRenderAppendGroup(relation)) continue;

    renderAppendGroup(items, relation, ruleMap, userNameMap);
  }

  // 4. 输出原始审批流里未处理 / 未开始的节点
  renderForecastUnfinishedNodes({
    items,
    workflowForecastNodes,
    workflowActivityRules,
    tasks,
    usedTaskIds,
    userNameMap,
    ccCompletedActivityIds,
  });

  return {
    processLine: `流程：${instance.title || ''}`,
    businessIdLine: `业务单号：${instance.businessId || ''}`,
    statusLine: `状态：${instance.status || ''}`,
    items,
  };
}

/**
 * 拼接 forecast 里的原始审批节点
 * 包含：
 * 1. 已生成 task 但未完成：PAUSED / NEW / RUNNING
 * 2. 还没生成 task 的后续节点：未开始
 */
function renderForecastUnfinishedNodes({
  items,
  workflowForecastNodes,
  workflowActivityRules,
  tasks,
  usedTaskIds,
  userNameMap,
  ccCompletedActivityIds,
}) {
  const orderedRules = getRulesByForecastOrder(workflowForecastNodes, workflowActivityRules);

  for (const rule of orderedRules) {
    const activityId = rule.activityId;

    if (ccCompletedActivityIds.has(activityId)) continue;

    if (isCcRule(rule)) {
      renderNotStartedOriginalNode(items, rule, userNameMap);
      continue;
    }

    const nodeTasks = tasks.filter(task => {
      if (task.activityId !== activityId) return false;
      if (usedTaskIds.has(task.taskId)) return false;

      return ['PAUSED', 'NEW', 'RUNNING'].includes(task.status);
    });

    if (nodeTasks.length > 0) {
      renderGeneratedOriginalNode(items, rule, nodeTasks, userNameMap);
      continue;
    }

    const hasAnyTask = tasks.some(task => task.activityId === activityId);

    if (!hasAnyTask) {
      renderNotStartedOriginalNode(items, rule, userNameMap);
    }
  }
}

/**
 * 已生成但未完成的原始节点
 */
function renderGeneratedOriginalNode(items, rule, nodeTasks, userNameMap) {
  const method = getApprovalMethod(rule);
  const activityId = rule.activityId;
  const activityName = rule.activityName || '审批人';
  const methodText = formatApprovalMethod(method);
  const namesWithStatus = nodeTasks
    .map(task => {
      const name = getName(task.userId, userNameMap);
      if (!name) return '';
      return formatPersonNodeData(name, task);
    })
    .filter(Boolean)
    .join('、');

  const names = joinNames(nodeTasks, userNameMap, (task) => task.userId);
  const statusCode = nodeTasks.some(task => task.status === 'RUNNING') ? 1 : 0;

  items.push(createNodeItem({
    kind: 'forecast_generated',
    activityId,
    approvalMethod: method,
    nodeName: activityName,
    nodeData: statusCode === 1
      ? buildRunningNodeData(
        namesWithStatus,
        methodText,
        getVisibleApproverCount(nodeTasks, userNameMap, (task) => task.userId),
      )
      : buildPendingNodeData(
        names,
        methodText,
        getVisibleApproverCount(nodeTasks, userNameMap, (task) => task.userId),
      ),
    date: '',
    remark: '',
    statusCode,
  }));
}

/**
 * 还没生成 task 的原始后续节点
 */
function renderNotStartedOriginalNode(items, rule, userNameMap) {
  const actioners = rule.activityActioners || [];
  const method = getApprovalMethod(rule);
  const activityName = rule.activityName || '审批人';
  const activityId = rule.activityId;
  const methodText = formatApprovalMethod(method);
  const isCcNode = isCcRule(rule);
  const names = joinNames(actioners, userNameMap, (user) => user.userId);

  items.push(createNodeItem({
    kind: 'forecast_not_started',
    activityId,
    approvalMethod: method,
    nodeName: isCcNode ? CC_NODE_NAME : activityName,
    nodeData: isCcNode
      ? (names || '（待抄送）')
      : buildPendingNodeData(
        names,
        methodText,
        getVisibleApproverCount(actioners, userNameMap, (user) => user.userId),
      ),
    date: '',
    remark: '',
    statusCode: isCcNode ? 2 : 0,
  }));
}

/**
 * 根据 workflowForecastNodes 排原始节点顺序
 */
function getRulesByForecastOrder(workflowForecastNodes, workflowActivityRules) {
  const orderMap = new Map();

  workflowForecastNodes.forEach((node, index) => {
    orderMap.set(node.activityId, index);
  });

  return workflowActivityRules
    .slice()
    .sort((a, b) => {
      const aOrder = orderMap.has(a.activityId) ? orderMap.get(a.activityId) : 999999;
      const bOrder = orderMap.has(b.activityId) ? orderMap.get(b.activityId) : 999999;

      return aOrder - bOrder;
    });
}

/**
 * 根据一次加签操作，动态找出本次加签生成的 tasks
 */
function findAppendTasks(record, tasks, usedTaskIds) {
  const recordTime = toTime(record.date);

  const candidates = tasks.filter(task => {
    if (usedTaskIds.has(task.taskId)) return false;
    if (task.activityId !== record.activityId) return false;
    if (toTime(task.createTime) < recordTime) return false;

    return true;
  });

  if (candidates.length === 0) return [];

  const groupMap = new Map();

  for (const task of candidates) {
    const key = task.createTime;
    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }
    groupMap.get(key).push(task);
  }

  const groups = Array.from(groupMap.entries())
    .map(([createTime, groupTasks]) => ({
      createTime,
      tasks: groupTasks,
    }))
    .sort((a, b) => toTime(a.createTime) - toTime(b.createTime));

  for (const group of groups) {
    let groupTasks = dedupeUserTasks(group.tasks);

    /**
     * 同一时间可能包含：
     * - 原始节点任务：PAUSED / NEW
     * - 加签生成任务：COMPLETED / RUNNING / CANCELED
     *
     * 优先取 COMPLETED / RUNNING / CANCELED
     */
    const hasRealAppendStatus = groupTasks.some(task => {
      return ['COMPLETED', 'RUNNING', 'CANCELED'].includes(task.status);
    });

    if (hasRealAppendStatus) {
      groupTasks = groupTasks.filter(task => {
        return ['COMPLETED', 'RUNNING', 'CANCELED'].includes(task.status);
      });
    } else {
      groupTasks = groupTasks.filter(task => task.status !== 'PAUSED');
    }

    if (groupTasks.length > 0) {
      return groupTasks;
    }
  }

  return [];
}

/**
 * 同一个 userId 同一组里可能有多个 task，取优先级高的
 */
function dedupeUserTasks(tasks) {
  const map = new Map();

  for (const task of tasks) {
    const old = map.get(task.userId);

    if (!old) {
      map.set(task.userId, task);
      continue;
    }

    if (getTaskPriority(task) < getTaskPriority(old)) {
      map.set(task.userId, task);
    }
  }

  return Array.from(map.values())
    .sort((a, b) => Number(a.taskId || 0) - Number(b.taskId || 0));
}

function getTaskPriority(task) {
  const map = {
    COMPLETED: 1,
    RUNNING: 2,
    CANCELED: 3,
    NEW: 4,
    PAUSED: 5,
  };

  return map[task.status] || 99;
}

function resolveAppendGroupStatusCode(tasks) {
  if (tasks.some(task => task.status === 'RUNNING')) return 1;
  if (tasks.some(task => task.status === 'COMPLETED' && task.result === 'REFUSE')) return 3;
  if (tasks.some(task => task.status === 'COMPLETED' && task.result === 'AGREE')) return 2;
  return 0;
}

function getAppendGroupOperateDate(tasks, statusCode) {
  if (!shouldShowOperateDate(statusCode)) return '';
  const finishedTasks = tasks
    .filter(task => task.status === 'COMPLETED' && task.finishTime)
    .sort((a, b) => toTime(b.finishTime) - toTime(a.finishTime));

  return finishedTasks[0]?.finishTime || '';
}

/**
 * 是否需要把加签任务作为组展示
 */
function shouldRenderAppendGroup(relation) {
  const tasks = relation.tasks || [];
  if (tasks.length === 0) return false;

  const hasCanceled = tasks.some(task => task.status === 'CANCELED');
  const hasRunning = tasks.some(task => task.status === 'RUNNING');

  if (tasks.length > 1 && hasCanceled) return true;
  if (hasRunning) return true;

  return false;
}

/**
 * 渲染加签组
 */
function renderAppendGroup(items, relation, ruleMap, userNameMap) {
  const tasks = relation.tasks || [];
  const rule = ruleMap.get(relation.record.activityId);
  const methodText = getAppendApprovalMethodText(tasks, userNameMap);
  const namesWithStatus = tasks
    .map(task => {
      const name = getName(task.userId, userNameMap);
      if (!name) return '';
      return formatPersonNodeData(name, task);
    })
    .filter(Boolean)
    .join('、');

  const statusCode = resolveAppendGroupStatusCode(tasks);

  items.push(createNodeItem({
    kind: 'append_group',
    recordType: relation.record.type,
    activityId: relation.record.activityId,
    nodeName: relation.record.showName || rule?.activityName || '审批人',
    nodeData: buildRunningNodeData(
      namesWithStatus,
      methodText,
      getVisibleApproverCount(tasks, userNameMap, (task) => task.userId),
    ),
    date: getAppendGroupOperateDate(tasks, statusCode),
    remark: '',
    statusCode,
  }));
}

/**
 * 判断这个 task 是否属于后面统一展示的加签组
 */
function isInGroupedAppendTask(task, appendRelations) {
  return appendRelations.some(relation => {
    if (!shouldRenderAppendGroup(relation)) return false;

    return relation.tasks.some(item => item.taskId === task.taskId);
  });
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
      && formatTime(task.finishTime) === formatTime(record.date);
  });
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
  };

  for (const rule of workflowActivityRules || []) {
    for (const user of rule.activityActioners || []) {
      if (user.userId && user.name) {
        map[user.userId] = user.name;
      }
    }
  }

  // 没名字的兜底用 userId
  for (const task of tasks || []) {
    if (task.userId && !map[task.userId] && !isPlaceholderUserId(task.userId)) {
      map[task.userId] = task.userId;
    }
  }

  for (const record of operationRecords || []) {
    if (record.userId && !map[record.userId] && !isPlaceholderUserId(record.userId)) {
      map[record.userId] = record.userId;
    }
  }

  return map;
}

function buildRuleMap(workflowActivityRules) {
  const map = new Map();
  for (const rule of workflowActivityRules || []) {
    map.set(rule.activityId, rule);
  }
  return map;
}

function shouldShowOperateDate(statusCode) {
  return statusCode !== 0 && statusCode !== 1;
}

function createNodeItem({
  kind,
  nodeName,
  nodeData,
  date = '',
  remark = '',
  statusCode = 2,
  ...meta
}) {
  const finalDate = shouldShowOperateDate(statusCode) ? date : '';

  return {
    kind,
    ...meta,
    nodeName,
    nodeData,
    showName: nodeName,
    remark,
    statusCode,
    date: finalDate,
    displayDate: formatTime(finalDate),
  };
}

function getVisibleApproverCount(list, userNameMap, getUserId = (item) => item?.userId ?? item) {
  return list.filter(item => getName(getUserId(item), userNameMap, item?.name)).length;
}

function formatApprovalMethod(method) {
  return APPROVAL_METHOD_TEXT[method] || '';
}

function buildRunningNodeData(namesWithStatus, methodText, count) {
  if (!namesWithStatus) return '';
  if (count > 1 && methodText) {
    return `${namesWithStatus} ${methodText}`;
  }
  return namesWithStatus;
}

function buildPendingNodeData(names, methodText, count) {
  if (!names) return '（待审批）';
  if (count > 1 && methodText) {
    return `${names} ${methodText}（待审批）`;
  }
  return `${names}（待审批）`;
}

function formatCcNodeData(record, userNameMap) {
  const ids = record.ccUserIds || [];
  return joinNames(ids, userNameMap, (id) => id);
}

function getAppendApprovalMethodText(appendTasks, userNameMap) {
  // 加签产生的审批固定为或签；仅多人时展示审批方式
  const count = getVisibleApproverCount(appendTasks || [], userNameMap, (task) => task.userId);
  if (count <= 1) return '';
  return formatApprovalMethod('OR');
}

function isAppendInExecution(appendTasks) {
  return (appendTasks || []).some(task => (
    task.status === 'RUNNING' || task.result === 'RUNNING'
  ));
}

function filterSelfAppendTasks(appendTasks, operatorUserId) {
  return (appendTasks || []).filter(task => (
    String(task.userId) !== String(operatorUserId)
  ));
}

function formatAppendRecordNodeData(record, appendTasks, userNameMap) {
  const operator = getName(record.userId, userNameMap);
  const appendAction = APPEND_ACTION_TEXT[record.type] || '加签审批';
  const otherAppendTasks = filterSelfAppendTasks(appendTasks, record.userId);
  const appendedNames = joinNames(otherAppendTasks, userNameMap, (task) => task.userId);
  const inExecution = isAppendInExecution(otherAppendTasks);
  const methodText = inExecution ? getAppendApprovalMethodText(otherAppendTasks, userNameMap) : '';
  const methodSuffix = methodText ? ` ${methodText}` : '';

  if (!operator && !appendedNames) return '';
  if (!appendedNames) return `${operator} ${appendAction}`.trim();
  return `${operator} ${appendAction} ${appendedNames}${methodSuffix}`.trim();
}

function formatRedirectNodeData(record, tasks, userNameMap) {
  const operator = getName(record.userId, userNameMap);
  const targetUserId = getRedirectTargetUserId(record, tasks);

  if (!targetUserId) {
    return `${operator} 转交`;
  }

  const targetName = getName(targetUserId, userNameMap);
  if (!targetName || targetName === targetUserId) {
    return `${operator} 已转交`;
  }

  return `${operator} 转交 ${targetName}`;
}

function getRedirectTargetUserId(record, tasks) {
  const source = tasks.find(task => (
    String(task.userId) === String(record.userId)
    && task.finishTime === record.date
    && task.result === 'REDIRECTED'
  ));

  if (source?.finishTime) {
    const candidates = tasks.filter(task => (
      task.createTime === source.finishTime && task.taskId !== source.taskId
    ));
    const target = candidates.find(task => (
      String(task.userId) !== String(record.userId)
    ));
    if (target) return target.userId;
  }

  const byDate = tasks.filter(task => (
    task.createTime === record.date
    && String(task.userId) !== String(record.userId)
  ));

  return byDate[0]?.userId || null;
}

function getApprovalMethod(rule) {
  return rule?.workflowActor?.approvalMethod || '';
}

function isAppendRecord(record) {
  return record.type === 'APPEND_TASK_BEFORE'
    || record.type === 'APPEND_TASK_AFTER';
}

function getTaskStatusText(task) {
  if (task.status === 'COMPLETED' && task.result === 'AGREE') {
    return '已同意';
  }

  if (task.status === 'COMPLETED' && task.result === 'REFUSE') {
    return '已拒绝';
  }

  if (task.status === 'RUNNING') {
    return '审批中';
  }

  return '';
}

function formatPersonNodeData(name, task) {
  if (!name) return '';
  const status = getResultText(task);
  if (!status) return name;
  return `${name}（${status}）`;
}

function getResultText(task) {
  if (task.result === 'AGREE') return '已同意';
  if (task.result === 'REFUSE') return '已拒绝';

  return getTaskStatusText(task);
}

function isPlaceholderUserId(userId) {
  return String(userId || '').includes('V00_');
}

function getName(userId, userNameMap, defaultName = '') {
  if (isPlaceholderUserId(userId)) return PLACEHOLDER_USER_NAME;
  return userNameMap[userId] || defaultName || userId;
}

function joinNames(list, userNameMap, getUserId = (item) => item) {
  return list
    .map(item => getName(getUserId(item), userNameMap, item?.name))
    .filter(Boolean)
    .join('、');
}

function toTime(value) {
  if (!value) return 0;
  return new Date(value).getTime();
}

/**
 * 不做时区转换，直接按钉钉返回值展示
 * 2026-06-12T09:31Z => 06-12 09:31
 */
function formatTime(value) {
  if (!value) return '';
  return `${value.slice(5, 10)} ${value.slice(11, 16)}`;
}

function itemsToTableRows(items) {
  let seq = 0;
  const nextId = () => `approval-row-${++seq}`;

  return (items || []).map(item => {
    const statusCode = item.statusCode ?? 2;
    const showDate = shouldShowOperateDate(statusCode);

    return {
      id: nextId(),
      statusCode,
      nodeName: item.nodeName,
      nodeData: item.nodeData,
      showName: item.nodeName,
      displayApprover: item.nodeData,
      status: item.nodeName,
      remark: item.remark || '-',
      date: showDate ? (item.date || '') : '',
      displayDate: showDate ? (item.displayDate || '') : '',
      kind: item.kind,
    };
  });
}

function getApproverDisplay(record) {
  return record?.nodeData || record?.displayApprover || '';
}

export function useApprovalDetailTimeline() {
  const dingUserListRef = ref({});
  const approvalTableData = ref([]);

  function buildApprovalFlow(nodeData) {
    const payload = buildDingApprovalFlowWithHistories(nodeData, dingUserListRef.value);
    console.log('[buildDingApprovalFlowWithHistories]', JSON.stringify(payload, null, 2));
    approvalTableData.value = itemsToTableRows(payload.current?.items || []);
  }

  async function getData(nodeData) {
    const { data } = await getDingUserList();
    dingUserListRef.value = (data || []).reduce((acc, item) => {
      acc[String(item.userid)] = item.name;
      return acc;
    }, {});
    buildApprovalFlow(nodeData);
  }

  return {
    approvalTableData,
    getApproverDisplay,
    getData,
  };
}
