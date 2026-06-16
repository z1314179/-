import { ref } from "vue";
import { getDingUserList } from "@/api/Contract/intention";
const APPROVAL_METHOD_TEXT = {
  AND: " 会签",
  ONE_BY_ONE: " 依次",
  OR: " 或签",
};
const TYPE = {
  START_PROCESS_INSTANCE: "",
  REDIRECT_TASK: "转交 ",
  REDIRECT_PROCESS: "退回 ",
  PROCESS_CC: "",
  EXECUTE_TASK_NORMAL: "",
  APPEND_TASK_BEFORE: " 审批前加签 ",
  APPEND_TASK_AFTER: " 审批后加签 ",
};
const RESULT_TEXT = {
  AGREE: "（已同意）",
  REFUSE: "（已拒绝）",
  NONE: "（待审批）",
  RUNNING: "（待审批）",
};
const PENDING_METHOD_TEXT = {
  AND: "（会签）",
  ONE_BY_ONE: "（依次）",
  OR: "（或签）",
};

function getStatusDisplay(record) {
  if (record.type === "EXECUTE_TASK_NORMAL") {
    return RESULT_TEXT[record.result] || record.result || "";
  }
  if (APPROVAL_METHOD_TEXT[record.result]) {
    return APPROVAL_METHOD_TEXT[record.result];
  }
  if (record.result === "RUNNING") {
    return RESULT_TEXT.RUNNING;
  }
  return TYPE[record.type] || record.type || "";
}

const dingUserListRef = ref({});

// ========== 人员显示 ==========
function isPlaceholderUserId(userId) {
  return String(userId || "").indexOf("_") > -1;
}

/** 沿 task 链把 V00_ 替换成下一跳真实 userId（不改动原始数据） */
function resolveRealUserIdFromTasks(userId, tasks) {
  if (!isPlaceholderUserId(userId) || !tasks?.length) return userId;

  const placeholderTask = tasks.find(
    (t) => String(t.userId) === String(userId),
  );
  if (!placeholderTask) return userId;

  let current = placeholderTask;
  const visited = new Set();
  while (current && !visited.has(current.taskId)) {
    visited.add(current.taskId);
    if (!current.finishTime) break;
    const next = tasks.find(
      (t) => t.createTime === current.finishTime && t.taskId !== current.taskId,
    );
    if (!next) break;
    if (!isPlaceholderUserId(next.userId)) return next.userId;
    current = next;
  }
  return userId;
}

function resolveApproverDisplay(userId, record) {
  let dingUserMap = dingUserListRef.value;
  const resolveOne = (uid) => {
    let realUid = uid;
    if (record && isPlaceholderUserId(uid)) {
      realUid = resolveRealUserIdFromTasks(
        uid,
        record.tasksAll || record.tasks,
      );
    }
    if (isPlaceholderUserId(realUid)) return "";
    if (realUid != null && realUid !== "") {
      return dingUserMap[String(realUid)] || realUid;
    }
    return "";
  };
  if (Array.isArray(userId)) {
    return userId.map(resolveOne).filter(Boolean).join("、");
  }
  return resolveOne(userId);
}

// ========== 历史加签：批次匹配与被加签人 ==========
//
// 加签数据均来自接口详情里的 workflowForeData（见 Intention/Detail.vue 等）：
//   - processInstances.extJson.operationRecords：加签操作记录，type 为 APPEND_TASK_BEFORE / APPEND_TASK_AFTER
//   - processInstances.extJson.tasks：审批任务，按 activityId + createTime 匹配被加签人
//   - processHistories[].extJson：历史流程实例，结构同上，由 appendHistoryRecords → handletasks 并入时间线
//
function isAppendOperation(type) {
  return type === "APPEND_TASK_BEFORE" || type === "APPEND_TASK_AFTER";
}

function isTaskRunning(task) {
  return task?.status === "RUNNING" || task?.result === "RUNNING";
}

function getAppendSignLabel(type, wrapped = false) {
  const label = type === "APPEND_TASK_BEFORE" ? "前加签" : "后加签";
  return wrapped ? `(${label}) ` : label;
}

/** 本次加签 operationRecord 在列表中的下标 */
function findAppendOpIndex(operationRecords, item) {
  return findOpIndex(operationRecords, item);
}

function findOpIndex(operationRecords, item) {
  if (!operationRecords?.length || !item) return -1;
  return operationRecords.findIndex(
    (op) =>
      op.date === item.date &&
      op.type === item.type &&
      String(op.userId) === String(item.userId) &&
      String(op.activityId || "") === String(item.activityId || ""),
  );
}

/** 加签 operation 与同刻同人的 EXECUTE AGREE 成对（钉钉：先「添加审批人」行，再「已同意」行） */
function getAppendExecutePair(record) {
  const ops = record.operationRecords || [];
  const idx = findOpIndex(ops, record);
  if (idx === -1) return null;
  if (isAppendOperation(record.type)) {
    const next = ops[idx + 1];
    if (
      next?.type === "EXECUTE_TASK_NORMAL" &&
      next.date === record.date &&
      String(next.userId) === String(record.userId) &&
      next.result === "AGREE"
    ) {
      return { append: record, execute: next };
    }
    return null;
  }
  if (record.type === "EXECUTE_TASK_NORMAL" && record.result === "AGREE") {
    const prev = ops[idx - 1];
    if (
      prev &&
      isAppendOperation(prev.type) &&
      prev.date === record.date &&
      String(prev.userId) === String(record.userId)
    ) {
      return { append: prev, execute: record };
    }
  }
  return null;
}

/** 加签动作行：仅取与 op.date 同刻创建的 task 作为「添加审批人」名单 */
function getAppendActionAppendedNames(record) {
  const pool = record.tasks?.length
    ? record.tasks
    : (record.tasksAll || []).filter((t) => t.createTime === record.date);
  const tasks = pool.filter(
    (t) =>
      String(t.userId) !== String(record.userId) &&
      !isPlaceholderUserId(t.userId),
  );
  if (!tasks.length) return getAppendDisplayFallback(record);
  return formatAppendedTaskNames(record, tasks);
}

/** 下一次同节点操作时间（用于隔离多次加签批次） */
function getAppendUpperBound(operationRecords, item, itemIndex) {
  const idx = itemIndex ?? findAppendOpIndex(operationRecords, item);
  if (idx === -1) return null;
  for (let i = idx + 1; i < operationRecords.length; i++) {
    const op = operationRecords[i];
    if (
      String(op.activityId || "") === String(item.activityId || "") &&
      (isAppendOperation(op.type) ||
        op.type === "EXECUTE_TASK_NORMAL" ||
        op.type === "REDIRECT_TASK" ||
        op.type === "REDIRECT_PROCESS")
    ) {
      return op.date;
    }
  }
  return null;
}

function isTaskBeforeUpperBound(task, upperBound) {
  return !upperBound || task.createTime < upperBound;
}

/** 本次加签批次 tasks（按上下界隔离多次加签）
 *  数据来源：handletasks 中 resultTasks[activityId]（即 processInstances.tasks 按节点分组）
 *  前加签：createTime >= op.date；后加签：从 anchor（createTime >= op.date 的首条 task）起至 upperBound
 */
function getAppendBatchTasks(relatedTasks, item, operationRecords, itemIndex) {
  const upperBound = getAppendUpperBound(operationRecords, item, itemIndex);
  const lowerBound = item.date;

  if (item.type === "APPEND_TASK_AFTER") {
    const anchor = relatedTasks.find(
      (e) =>
        e.createTime >= item.date && isTaskBeforeUpperBound(e, upperBound),
    );
    if (!anchor) return [];
    return relatedTasks.filter(
      (e) =>
        e.createTime >= anchor.createTime &&
        isTaskBeforeUpperBound(e, upperBound),
    );
  }

  let candidates = relatedTasks.filter(
    (t) =>
      t.createTime >= lowerBound &&
      isTaskBeforeUpperBound(t, upperBound) &&
      String(t.userId) !== String(item.userId) &&
      !isPlaceholderUserId(t.userId),
  );

  if (!candidates.length) {
    candidates = relatedTasks.filter(
      (t) =>
        t.createTime === item.date &&
        String(t.userId) !== String(item.userId) &&
        !isPlaceholderUserId(t.userId),
    );
  }

  if (!candidates.length) return [];

  let batchTime = candidates[0].createTime;
  candidates.forEach((t) => {
    if (t.createTime < batchTime) batchTime = t.createTime;
  });
  return candidates.filter((t) => t.createTime === batchTime);
}

/** 被加签人：userId !== 操作人；历史加签可包含 NEW
 *  优先 record.tasks（getAppendBatchTasks 写入的批次任务），否则从 record.tasksAll 按 createTime 筛选
 */
function getAppendedTasks(record) {
  let pool;
  if (record.tasks?.length) {
    pool = record.tasks;
  } else {
    const tasksAll = record.tasksAll || [];
    if (record.type === "APPEND_TASK_AFTER") {
      const anchor = tasksAll.find((e) => e.createTime >= record.date);
      pool = anchor
        ? tasksAll.filter((e) => e.createTime >= anchor.createTime)
        : [];
    } else {
      pool = tasksAll.filter((e) => e.createTime === record.date);
    }
  }

  const isHistoryAppend =
    isAppendOperation(record.type) && record.result !== "RUNNING";
  let tasks = pool.filter((e) => {
    if (String(e.userId) === String(record.userId)) return false;
    if (isPlaceholderUserId(e.userId)) return false;
    if (!isHistoryAppend && e.status === "NEW") return false;
    return true;
  });

  if (isHistoryAppend && tasks.some((t) => t.status === "COMPLETED")) {
    const hasLaterRunning = (record.tasksAll || []).some(
      (t) => isTaskRunning(t) && t.createTime >= record.date,
    );
    if (hasLaterRunning) {
      tasks = tasks.filter((t) => t.status !== "COMPLETED");
    }
  }
  return tasks;
}

function formatAppendedTaskNames(record, tasks) {
  return tasks
    .map((task) => resolveApproverDisplay(task.userId, record))
    .filter(Boolean)
    .join("、");
}

/** 历史加签无留存 task 时，用下一次加签操作人兜底 */
function getAppendDisplayFallback(record) {
  const ops = record.operationRecords;
  const idx = findAppendOpIndex(ops, record);
  if (idx === -1 || !ops?.length) return "";

  const next = ops[idx + 1];
  if (
    next?.activityId === record.activityId &&
    isAppendOperation(next.type) &&
    String(next.userId) !== String(record.userId)
  ) {
    return resolveApproverDisplay(next.userId, record) || "";
  }
  return "";
}

/** 获取被加签人显示文本 */
function getAppendedDisplayText(record) {
  const appendedTasks = getAppendedTasks(record);
  if (appendedTasks.length) {
    return formatAppendedTaskNames(record, appendedTasks);
  }
  return getAppendDisplayFallback(record);
}

function formatAppendDisplay(record) {
  const pair = getAppendExecutePair(record);
  if (pair?.append === record) {
    const operator = resolveApproverDisplay(record.userId, record);
    const appendedDisplay = getAppendActionAppendedNames(record);
    return appendedDisplay
      ? `${operator}(加签) 添加审批人：${appendedDisplay}`
      : `${operator}(加签)`;
  }

  const signTypeText = TYPE[record.type] || "";
  let result = resolveApproverDisplay(record.userId, record) + signTypeText;
  const appendedTasks = getAppendedTasks(record);
  if (appendedTasks.some((t) => isTaskRunning(t))) {
    return result;
  }
  const appendedDisplay = appendedTasks.length
    ? formatAppendedTaskNames(record, appendedTasks)
    : getAppendDisplayFallback(record);
  return appendedDisplay ? result + appendedDisplay : result;
}

// ========== 进行中加签：独立 pending 行 ==========
/** 进行中加签 pending 行
 *  数据来源：processInstances.operationRecords 中 type 为加签的操作（倒序取最近一条）
 *           + processInstances.tasks 中同 activityId 且 status/result 为 RUNNING 的任务
 */
function resolveRunningAppendState(processInstances, workflowActivityRulesMap) {
  if (!processInstances?.tasks?.length || !processInstances?.operationRecords?.length) {
    return { pendingRow: null };
  }

  const runningTasks = processInstances.tasks.filter(
    (t) => isTaskRunning(t) && t.activityId,
  );
  if (!runningTasks.length) return { pendingRow: null };

  const appendOps = processInstances.operationRecords.filter(
    (op) => op.activityId && isAppendOperation(op.type),
  );

  for (let i = appendOps.length - 1; i >= 0; i--) {
    const op = appendOps[i];
    const runningOnActivity = runningTasks.filter(
      (t) => t.activityId === op.activityId,
    );
    if (!runningOnActivity.length) continue;

    const relatedTasks = processInstances.tasks.filter(
      (t) => t.activityId === op.activityId,
    );
    const rule = workflowActivityRulesMap[op.activityId] || {};
    return {
      pendingRow: {
        isAppendPending: true,
        activityId: op.activityId,
        result: "RUNNING",
        type: op.type,
        showName: op.showName,
        userId: op.userId,
        tasks: runningOnActivity,
        tasksAll: relatedTasks,
        workflowActor: rule.workflowActor,
        processStatus: processInstances.status,
      },
    };
  }
  return { pendingRow: null };
}

function findForecastNodeIndex(res, activityId) {
  return res.findIndex(
    (item) =>
      item.activityId === activityId &&
      !item.isAppendPending &&
      !isAppendOperation(item.type) &&
      item.index == null &&
      (Array.isArray(item.tasks) || item.activityActioners),
  );
}

// ========== 转交 ==========
/** 转交链：finishTime 匹配 createTime；result 为 REDIRECTED 继续找，status 为 RUNNING 停止 */
function resolveRedirectTargetTask(tasks, task) {
  if (!task?.finishTime) return task;
  const next = tasks.find(
    (t) => t.createTime === task.finishTime && t.taskId !== task.taskId,
  );
  if (!next) return task;
  if (next.result === "REDIRECTED") {
    return resolveRedirectTargetTask(tasks, next);
  }
  if (next.status === "RUNNING") {
    return next;
  }
  return next;
}

/** 转交目标：操作人在 date 时刻 REDIRECTED 后 createTime 对应的第一跳任务 */
function pickRedirectTarget(candidates, operatorId) {
  const others = candidates.filter(
    (t) =>
      String(t.userId) !== String(operatorId) && !isPlaceholderUserId(t.userId),
  );
  const pool = others.length
    ? others
    : candidates.filter((t) => String(t.userId) !== String(operatorId));
  return (
    pool.find((t) => t.status === "RUNNING") ||
    pool.find((t) => t.status === "CANCELED") ||
    pool.find((t) => t.status === "COMPLETED") ||
    pool[0] ||
    null
  );
}

function getRedirectTargetTask(record, allTasks) {
  const tasks = allTasks || record.tasksAll || record.tasks || [];
  const source = tasks.find(
    (t) =>
      String(t.userId) === String(record.userId) &&
      t.finishTime === record.date &&
      t.result === "REDIRECTED",
  );
  if (source?.finishTime) {
    const candidates = tasks.filter(
      (t) => t.createTime === source.finishTime && t.taskId !== source.taskId,
    );
    const target = pickRedirectTarget(candidates, record.userId);
    if (target) return target;
  }
  const byDate = tasks.filter(
    (t) =>
      t.createTime === record.date &&
      String(t.userId) !== String(record.userId),
  );
  return pickRedirectTarget(byDate, record.userId);
}

/** 转交目标：task 解析 + 链上替换 V00_；仍无效时用下一条操作记录（仅转交行） */
function resolveRedirectTargetUserId(record) {
  const tasks = record.tasksAll || record.tasks || [];
  const target = getRedirectTargetTask(record);
  if (target?.userId) {
    const realId = resolveRealUserIdFromTasks(target.userId, tasks);
    if (!isPlaceholderUserId(realId)) {
      const name = resolveApproverDisplay(realId);
      if (name) return realId;
    }
  }
  const nextUserId = record.nextRecord?.userId;
  if (
    nextUserId &&
    !isPlaceholderUserId(nextUserId) &&
    String(nextUserId) !== String(record.userId)
  ) {
    return nextUserId;
  }
  return null;
}

function formatRedirectDisplay(record) {
  const operator = resolveApproverDisplay(record.userId, record);
  const targetUserId = resolveRedirectTargetUserId(record);
  if (!targetUserId) {
    return operator + "转交";
  }
  const targetName = resolveApproverDisplay(targetUserId);
  if (!targetName) {
    return operator + "已转交";
  }
  return operator + " 转交 " + targetName;
}

// ========== 操作节点列展示 ==========
function mapTasksToApproverNames(tasks, record) {
  return tasks
    .map((e) => {
      if (e.result === "REDIRECTED") {
        const target = resolveRedirectTargetTask(
          record.tasksAll || record.tasks,
          e,
        );
        return resolveApproverDisplay(target?.userId || e.userId, record);
      }
      return resolveApproverDisplay(e.userId, record);
    })
    .filter(Boolean);
}

function formatRunningDisplay(record) {
  const names = mapTasksToApproverNames(record.tasks || [], record);
  if (!names.length) return "";
  let methodText = "";
  if (names.length > 1 && record.workflowActor?.approvalMethod) {
    methodText = APPROVAL_METHOD_TEXT[record.workflowActor.approvalMethod];
  }
  return names.join("、") + methodText + "（审批中）";
}

function formatAppendPendingDisplay(record) {
  const names = mapTasksToApproverNames(record.tasks || [], record);
  if (!names.length) return "";
  return getAppendSignLabel(record.type, true) + names.join("、") + "（审批中）";
}

function formatCompletedDisplay(record) {
  if (record.type === "EXECUTE_TASK_NORMAL") {
    return (
      resolveApproverDisplay(record.userId, record) +
      RESULT_TEXT[record.result]
    );
  }
  if (record.type === "PROCESS_CC") {
    return resolveApproverDisplay(record.ccUserIds, record);
  }
  if (record.type === "REDIRECT_PROCESS") {
    return (
      resolveApproverDisplay(record.userId, record) +
      TYPE[record.type] +
      (record.NODENAME || "")
    );
  }
  return resolveApproverDisplay(record.userId, record);
}

function formatForecastPendingDisplay(record) {
  const names = (record.activityActioners || [])
    .map((item) => resolveApproverDisplay(item.userId, record))
    .filter(Boolean);
  let suffix = "";
  if (names.length > 1) {
    suffix += APPROVAL_METHOD_TEXT[record.workflowActor?.approvalMethod] || "";
  }
  if (record.showName === "审批人") {
    suffix += "（待审批）";
  }
  return names.join("、") + suffix;
}

function getApproverDisplay(record) {
  if (record.type === "REDIRECT_TASK") {
    return formatRedirectDisplay(record);
  }
  if (record.isAppendPending) {
    return formatAppendPendingDisplay(record);
  }
  if (record.result === "RUNNING" && record.tasks) {
    return formatRunningDisplay(record);
  }
  if (isAppendOperation(record.type)) {
    return formatAppendDisplay(record);
  }
  if (record.result) {
    return formatCompletedDisplay(record);
  }
  return formatForecastPendingDisplay(record);
}

function handleMsg(record) {
  if (record.result) {
    if (record.type === "PROCESS_CC") {
      return "抄送 " + resolveApproverDisplay(record.ccUserIds, record);
    }
    if (record.type === "REDIRECT_TASK") {
      const targetUserId = resolveRedirectTargetUserId(record);
      if (!targetUserId) return "转交";
      const targetName = resolveApproverDisplay(targetUserId);
      return targetName ? "转交 " + targetName : "已转交";
    }
    if (record.type === "REDIRECT_PROCESS") {
      return "退回";
    }
    if (isAppendOperation(record.type)) {
      const appendedDisplay = getAppendedDisplayText(record);
      const signTypeText = getAppendSignLabel(record.type);
      return appendedDisplay ? `${signTypeText} ${appendedDisplay}` : signTypeText;
    }
    return "";
  }

  if (record.activityType === "target_select") {
    return "（待抄送）";
  }
  if (record.activityType !== "target_approval") {
    return "";
  }
  if (record.activityName === "抄送人") {
    return "（待抄送）";
  }
  const methodText = PENDING_METHOD_TEXT[record.workflowActor?.approvalMethod] || "";
  if (!methodText) {
    return "（待审批）";
  }
  return record.activityActioners?.length > 1
    ? methodText + "（待审批）"
    : "（待审批）";
}

// ========== 时间线数据组装 ==========
function groupTasksByActivity(tasks) {
  const resultTasks = (tasks || []).reduce((acc, item) => {
    const key = item.activityId;
    if (acc[key]) {
      acc[key].push({ ...item });
    } else {
      acc[key] = [{ ...item }];
    }
    return acc;
  }, {});
  Object.keys(resultTasks).forEach((key) => {
    resultTasks[key].sort(
      (a, b) => new Date(a.createTime) - new Date(b.createTime),
    );
  });
  return resultTasks;
}

function buildWorkflowActivityRulesMap(workflowActivityRules) {
  return (workflowActivityRules || []).reduce(
    (acc, item) => {
      acc[item.activityId] = { ...item, showName: item.activityName };
      return acc;
    },
    {
      "sid-startevent": {
        activityId: "sid-startevent",
        showName: "提交申请",
      },
    },
  );
}

function appendHistoryRecords(processHistories, processInstances, res) {
  if (!processHistories?.length) return;
  const historys = processHistories.filter(
    (e) => e.dingProcessBusinessId != processInstances.businessId,
  );
  historys.forEach((item) => {
    if (item.extJson) {
      handletasks(item.extJson, res);
    }
  });
}

/** 当前审批节点及后续 forecast 节点 */
function buildForecastRows(
  processInstances,
  workflowForecastNodes,
  workflowActivityRulesMap,
  hasAppendRunning,
) {
  const rows = [];
  if (processInstances.status !== "RUNNING") return rows;

  const firstRunning = processInstances.tasks.find(
    (e) => e.status === "RUNNING",
  );
  if (!firstRunning) return rows;

  const activeActivityId = firstRunning.activityId;
  const activeTasks = processInstances.tasks.filter((e) =>
    ["RUNNING", "NEW"].includes(e.status),
  );

  let openState = false;
  workflowForecastNodes.forEach((item) => {
    if (item.activityId === "endId") return;
    if (!openState && item.activityId === activeActivityId) {
      openState = true;
    }
    if (!openState) return;

    const rule = workflowActivityRulesMap[item.activityId] || {};
    const row = {
      ...item,
      ...rule,
      processStatus: processInstances.status,
    };
    if (item.activityId === activeActivityId) {
      row.result = hasAppendRunning ? "" : "RUNNING";
      row.tasks = activeTasks;
      row.tasksAll = processInstances.tasks.filter(
        (t) => t.activityId === item.activityId,
      );
    }
    rows.push(row);
  });
  return rows;
}

function finalizeTimelineRecords(res) {
  res.forEach((item, index) => {
    item.nextRecord = res[index + 1];
    const pair = getAppendExecutePair(item);
    if (pair?.execute === item && pair.append?.type === "APPEND_TASK_AFTER") {
      item.showName = "审批人";
    } else if (pair?.execute === item && pair.append?.type === "APPEND_TASK_BEFORE") {
      item.showName = "审批人";
    } else if (pair?.append === item) {
      item.statusCode = 2;
    }
    if (item.statusCode == null) {
      item.statusCode = computeStatusCode(item);
    }
    item.msg = item.showName;
    if (item.type === "REDIRECT_PROCESS") {
      item.NODENAME = res[index + 1]?.showName || "";
    }
  });
}

function computeStatusCode(record) {
  if (record.result) {
    if (record.result === "RUNNING") {
      return 1;
    } else if (record.result === "AGREE") {
      return 2;
    } else if (record.result === "REFUSE") {
      return 3;
    } else if (record.result === "NONE") {
      return 2;
    }
  }
  return 0;
}

function insertAppendPendingRow(res, pendingRow) {
  if (!pendingRow) return;
  const index = findForecastNodeIndex(res, pendingRow.activityId);
  if (index !== -1) {
    res.splice(index, 0, pendingRow);
  }
}

/** 组装完整时间线；nodeData 即 workflowForeData */
function buildTimelineRecords(nodeData) {
  const {
    workflowForecastNodes,
    workflowActivityRules,
    processInstances, // extJson：含 tasks、operationRecords（加签操作在此）
    processHistories = [], // 历史实例 extJson，含历史加签
  } = nodeData;
  const forecast = workflowForecastNodes || [];
  if (!forecast.length) return [];

  const res = [];
  appendHistoryRecords(processHistories, processInstances, res);
  handletasks(processInstances, res);

  const rulesMap = buildWorkflowActivityRulesMap(workflowActivityRules);
  const { pendingRow } = resolveRunningAppendState(processInstances, rulesMap);

  res.push(
    ...buildForecastRows(
      processInstances,
      forecast,
      rulesMap,
      !!pendingRow,
    ),
  );
  insertAppendPendingRow(res, pendingRow);
  finalizeTimelineRecords(res);
  return res;
}

function handletasks(taskData, res) {
  const resultTasks = groupTasksByActivity(taskData?.tasks);
  const operationRecords = taskData.operationRecords || [];
  operationRecords.forEach((item, index) => {
    const relatedTasks = resultTasks[item.activityId] || [];
    let matchedTasks = [];
    if (item.type === "REDIRECT_TASK") {
      matchedTasks = relatedTasks.filter((task) => task.createTime === item.date);
    } else if (isAppendOperation(item.type)) {
      // 加签行：从 operationRecords 取操作，从 tasks 按批次匹配被加签人
      matchedTasks = getAppendBatchTasks(
        relatedTasks,
        item,
        operationRecords,
        index,
      );
    }
    item.index = operationRecords.length - index;
    item.tasksAll = relatedTasks;
    item.tasks = matchedTasks;
    res.push({
      ...item,
      createTime: item.date,
      processStatus: taskData.status,
      operationRecords,
    });
  });
}

export function useApprovalDetailTimeline() {
  const approvalRecords = ref([]);

  async function loadApprovalDetail(nodeData) {
    approvalRecords.value = buildTimelineRecords(nodeData);
  }

  const getData = async (nodeData) => {
    // nodeData 由 ApprovalDetailTimeline 传入，字段映射见详情页 workflowForeData：
    // forecastJson → workflowForecastNodes / workflowActivityRules
    // extJson → processInstances（tasks + operationRecords，加签数据入口）
    const { data } = await getDingUserList();
    dingUserListRef.value = (data || []).reduce((acc, item) => {
      acc[String(item.userid)] = item.name;
      return acc;
    }, {});
    await loadApprovalDetail(JSON.parse(JSON.stringify(nodeData)));
  };

  return {
    approvalTableData: approvalRecords,
    getApproverDisplay,
    getStatusDisplay,
    dingUserList: dingUserListRef,
    getData,
    handleMsg,
  };
}
