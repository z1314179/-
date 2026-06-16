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
export function useApprovalDetailTimeline() {
  const approvalRecords = ref([]);
  const dingUserList = ref({});
  function handleTimeline(
    processHistoriesList,
    operationRecordsList,
    workflowForecastNodesList,
  ) {
    let arr = [...processHistoriesList];

    let beforeAppendTask = [];
    let afterAppendTask = [];

    operationRecordsList.forEach((item) => {
      // =========================
      // 前加签（只补状态，不改顺序）
      // =========================
      if (item.type === "APPEND_TASK_BEFORE") {
        if (item.tasks?.length) {
          const running = item.tasks.filter((t) => t.result === "RUNNING");

          const pending = item.tasks.filter(
            (t) => !t.result || t.result === "NONE",
          );

          const node = {
            type: "beforeAppend",
            showName: "审批前加签",
            result: running.length ? "RUNNING" : "NONE",
            tasks: item.tasks,
            tasksAll: item.tasksAll,

            // ⭐ 只新增语义字段（不影响顺序）
            hasRunningAppend: running.length > 0,
            hasPendingAppend: pending.length > 0,
            runningTasks: running,
            pendingTasks: pending,
          };

          beforeAppendTask.push(node);
        }

        arr.push(item); // ❗保持你原顺序：不动
        return;
      }

      // =========================
      // 后加签（只补状态，不改顺序）
      // =========================
      if (item.type === "APPEND_TASK_AFTER") {
        if (item.tasks?.length) {          
          const running = item.tasks.filter((t) => t.result === "RUNNING");

          const pending = item.tasks.filter(
            (t) => !t.result || t.result === "NONE",
          );

          const node = {
            type: "afterAppend",
            showName: "审批后加签",
            result: running.length ? "RUNNING" : "NONE",
            tasks: item.tasksAll,
            tasksAll: item.tasksAll,
            runningTasks: running,
            pendingTasks: pending,
          };
          console.log(node);
          
          afterAppendTask.push(node);
        }

        arr.push(item); // ❗保持你原顺序
        return;
      }

      // =========================
      // 普通操作（完全不动）
      // =========================
      arr.push(item);
    });

    // =========================
    // ❗这里也不动你的顺序逻辑
    // =========================
    // arr.push(...beforeAppendTask);
    // arr.push(...afterAppendTask);
    arr.push(...workflowForecastNodesList);

    arr.forEach((item) => {
      item.statusCode = handleStatusDisplay(item);
    });
    console.log(afterAppendTask);
    
    return arr;
  }
  async function getData(nodeData) {
    const {
      processHistoriesList,
      operationRecordsList,
      workflowForecastNodesList,
    } = buildApprovalTimeline(nodeData);
    const arr = handleTimeline(
      processHistoriesList,
      operationRecordsList,
      workflowForecastNodesList,
    );

    try {
      const { data } = await getDingUserList();
      dingUserList.value = (data || []).reduce((acc, item) => {
        acc[String(item.userid)] = item.name;
        return acc;
      }, {});
    } catch (err) { }
    approvalRecords.value = arr;
  }
  function getTasks(tasks, date, finishTime) {
    return tasks.filter((item) => {
      return item.createTime === date
      // if (item.createTime === date) {
      //   return true;
      // }
      // return item.createTime >= date && item.createTime < finishTime;
    });
  }
  function handleOperationRecords(processInstances) {
    if (!processInstances?.tasks || !processInstances?.operationRecords) {
      return { list: [], afterActivityId: "" };
    }
    let arr = [];
    let afterActivityId = "";
    let tasksMap = processInstances.tasks.reduce((acc, item) => {
      if (acc[item.activityId]) {
        acc[item.activityId].push(item);
      } else {
        acc[item.activityId] = [item];
      }
      return acc;
    }, {});
    processInstances.operationRecords.forEach((item, index) => {
      afterActivityId = item.activityId || "sid-startevent";
      // const nextRecord = processInstances.operationRecords[index + 1];
      const activityTasks = tasksMap[item.activityId] || [];
      // if (nextRecord) {
      //   item.finishTime = nextRecord.date;
      //   item.tasks = getTasks(activityTasks, item.date, item.finishTime);
      //   item.tasksAll = activityTasks;
      // } else {
      //   item.tasks = activityTasks.filter((t) => t.createTime >= item.date);
      //   item.tasksAll = activityTasks;
      // }
      item.tasks = getTasks(activityTasks, item.date, item.finishTime);
      arr.push(item);
    });

    return { list: arr, afterActivityId };
  }
  function handleWorkflowForecastNodes(
    workflowForecastNodes,
    workflowActivityRules,
    afterActivityId,
  ) {
    let arr = [];
    let workflowActivityRulesMap = workflowActivityRules.reduce((acc, item) => {
      acc[item.activityId] = item;
      return acc;
    }, {});
    let openState = false;
    workflowForecastNodes.forEach((item) => {
      if (item.activityId === "endId") return;
      if (item.activityId === afterActivityId) {
        openState = true;
      }
      if (openState) {
        let obj = {
          ...item,
          ...workflowActivityRulesMap[item.activityId],
          showName: workflowActivityRulesMap[item.activityId]?.activityName,
          result: "RUNNING",
        };
        arr.push(obj);
      }
    });
    return arr;
  }
  function buildApprovalTimeline(nodeData) {
    const {
      processInstances,
      workflowForecastNodes,
      workflowActivityRules,
      processHistories,
    } = JSON.parse(JSON.stringify(nodeData));
    const processHistoriesList = [];
    (processHistories || [])
      .filter((e) => e.dingProcessBusinessId != processInstances?.businessId)
      .forEach((item) => {
        if (item.extJson) {
          const { list } = handleOperationRecords(item.extJson);
          processHistoriesList.push(...list);
        }
      });
    const { list: operationRecordsList, afterActivityId } =
      handleOperationRecords(processInstances);
    const workflowForecastNodesList = handleWorkflowForecastNodes(
      workflowForecastNodes,
      workflowActivityRules,
      afterActivityId,
    );
    return {
      processHistoriesList,
      operationRecordsList,
      workflowForecastNodesList,
    };
  }

  function getApproverDisplay(record) {
    let str = "";
    if (!record.result) {
      str = resolveApproverDisplay(
        record.activityActioners?.map((item) => item.userId),
      );
      str += record.workflowActor?.approvalMethod
        ? APPROVAL_METHOD_TEXT[record.workflowActor.approvalMethod]
        : "";
      str += record.showName == "审批人" ? "（待审批）" : "";
      return str;
    }
    const name = (uid) => resolveApproverDisplay(uid) || uid || "";
    if (
      record.type === "APPEND_TASK_BEFORE" ||
      record.type === "APPEND_TASK_AFTER"
    ) {
      const appended = (record.tasks || [])
        .filter((t) => String(t.userId) !== String(record.userId))
        .map((t) => name(t.userId))
        .filter(Boolean)
        .join("、");
      return name(record.userId) + TYPE[record.type] + appended;
    }
    if (record.type === "EXECUTE_TASK_NORMAL") {
      return name(record.userId) + (RESULT_TEXT[record.result] || "");
    }
    if (record.type === "REDIRECT_TASK") {
      return name(record.userId) + TYPE[record.type];
    }
    if (record.type === "REDIRECT_PROCESS") {
      return name(record.userId) + TYPE[record.type] + (record.NODENAME || "");
    }
    if (record.type === "PROCESS_CC") {
      return name(record.userId) + resolveApproverDisplay(record.ccUserIds);
    }
    if (record.type === "START_PROCESS_INSTANCE") {
      return name(record.userId);
    }
    return name(record.userId);
  }
  function resolveApproverDisplay(userId) {
    if (Array.isArray(userId)) {
      return userId
        .filter(Boolean)
        .map((item) => dingUserList.value[String(item)] || item)
        .join("、");
    }
    return dingUserList.value[String(userId)] || userId || "";
  }

  function handleStatusDisplay(record) {
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

  function getStatusDisplay(record) {
    return handleStatusDisplay(record);
  }

  function handleMsg(record) {
    return record?.showName || "";
  }

  return {
    approvalTableData: approvalRecords,
    getApproverDisplay,
    getStatusDisplay,
    dingUserList,
    getData,
    handleMsg,
  };
}
