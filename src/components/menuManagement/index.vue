<template>
  <div class="page-content">
    <div class="flex">
      <a-button type="primary" @click="add(record, 0)">新增</a-button>
      <a-popconfirm
        title="将按 mockRoutes 执行创建和删除，是否继续？"
        ok-text="确定"
        cancel-text="取消"
        @confirm="syncByMockRoutes"
      >
        <a-button class="mg-l-small" :loading="syncLoading">执行JSON同步</a-button>
      </a-popconfirm>
    </div>
    <a-alert
      v-if="syncReport"
      class="mg-t-medium"
      type="info"
      show-icon
      :message="syncSummaryText"
    />
    <div v-if="syncReport" class="sync-report mg-t-small pd-medium">
      <div class="sync-report-title">
        最近同步明细（{{ syncReport.time }}）
      </div>
      <a-row :gutter="16">
        <a-col :xs="24" :md="8">
          <div class="sync-section">
            <div class="sync-section-title">新增（{{ syncReport.added.length }}）</div>
            <a-empty v-if="!syncReport.added.length" description="无新增" :image="false" />
            <ul v-else class="sync-list">
              <li v-for="(item, idx) in syncReport.added" :key="`add-${idx}`">{{ item }}</li>
            </ul>
          </div>
        </a-col>
        <a-col :xs="24" :md="8">
          <div class="sync-section">
            <div class="sync-section-title">修改（{{ syncReport.updated.length }}）</div>
            <a-empty v-if="!syncReport.updated.length" description="无修改" :image="false" />
            <ul v-else class="sync-list">
              <li v-for="(item, idx) in syncReport.updated" :key="`upd-${idx}`">{{ item }}</li>
            </ul>
          </div>
        </a-col>
        <a-col :xs="24" :md="8">
          <div class="sync-section">
            <div class="sync-section-title">删除（{{ syncReport.deleted.length }}）</div>
            <a-empty v-if="!syncReport.deleted.length" description="无删除" :image="false" />
            <ul v-else class="sync-list">
              <li v-for="(item, idx) in syncReport.deleted" :key="`del-${idx}`">{{ item }}</li>
            </ul>
          </div>
        </a-col>
      </a-row>
    </div>
    <div class=" mg-t-medium pd-y-medium pd-x-large">
      <a-table
        :dataSource="list"
        defaultExpandAllRows
        :pagination="{ position: ['bottomLeft'] }"
        :columns="columns"
      >
        <template #bodyCell="{ record, column }">
          <template v-if="column.key === 'bodyCell'">
            <a-button type="link" @click="add(record, record.id)"
              >新增</a-button
            >
            <a-button type="link" @click="edit(record)" class="pd-l-small"
              >编辑</a-button
            >
            <a-popconfirm
              title="确定要删除吗?"
              ok-text="确定"
              cancel-text="取消"
              @confirm="confirm(record.id)"
            >
              <a-button type="link" class="pd-l-small">删除</a-button>
            </a-popconfirm>
          </template>
        </template>
      </a-table>
    </div>
    <a-modal
      v-model:open="openMenu"
      :footer="null"
      title="菜单"
      :afterClose="afterClose"
      :aria-hidden="true"
      :maskClosable="false"
    >
      <a-form
        :model="formState"
        name="basic"
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 20 }"
        autocomplete="off"
        @finish="onFinish"
      >
        <a-form-item
          label="pid"
          name="pid"
          :rules="[{ required: true, message: '请输入pid' }]"
        >
          <a-input v-model:value="formState.pid" />
        </a-form-item>
        <a-form-item
          label="名称"
          name="name"
          :rules="[{ required: true, message: '请输入名称' }]"
        >
          <a-input v-model:value="formState.name" />
        </a-form-item>

        <a-form-item label="类型" name="type">
          <a-radio-group v-model:value="formState.type" button-style="solid">
            <a-radio-button :value="1">菜单</a-radio-button>
            <a-radio-button :value="2">按钮</a-radio-button>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="路由" name="title">
          <a-input v-model:value="formState.title" />
        </a-form-item>
        <a-form-item label="路径" name="uri">
          <a-input v-model:value="formState.uri" />
        </a-form-item>
        <a-form-item label="图标" name="icon">
          <a-input v-model:value="formState.icon" />
        </a-form-item>
        <a-form-item label="slug" name="slug">
          <a-input v-model:value="formState.slug" />
        </a-form-item>
        <a-form-item label="排序" name="sort">
          <a-input-number v-model:value="formState.sort" />
        </a-form-item>
        <a-form-item :wrapper-col="{ offset: 16, span: 8 }">
          <div class="flex">
            <a-button @click="openMenu = false">取消</a-button>
            <a-button type="primary" html-type="submit" class="mg-l-medium"
              >提交</a-button
            >
          </div>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { reactive, computed, ref, getCurrentInstance } from "vue";
import { getMenuList, addMenu, editMenu, delMenu } from "@/api/menu.js";
import { mockRoutes } from "@/api/mock/menuRoutes.js";
import { message } from "ant-design-vue";
defineOptions({
  name: "menuManagement",
});
const instance = getCurrentInstance();
const tableKey = ref(0);
const openMenu = ref(false);
const syncLoading = ref(false);
const syncReport = ref(null);
const syncSummaryText = computed(() => {
  if (!syncReport.value) return "";
  const { added, updated, deleted } = syncReport.value;
  return `JSON 同步完成：新增 ${added.length} 项，修改 ${updated.length} 项，删除 ${deleted.length} 项`;
});
const columns = [
  {
    title: "菜单名称",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "路由",
    dataIndex: "title",
    key: "title",
  },
  {
    title: "路径",
    dataIndex: "uri",
    key: "uri",
  },
  {
    title: "类型",
    dataIndex: "type",
    key: "type",
  },
  {
    title: "排序",
    dataIndex: "sort",
    key: "sort",
  },
  {
    title: "操作",
    dataIndex: "",
    key: "bodyCell",
  },
];
let initForm = {
  name: "",
  type: 1,
  title: "",
  uri: "",
  icon: "",
  slug: "",
  sort: 0,
};
const formState = ref({ ...initForm });
const list = ref([]);
getList();
const afterOpen = () => {
  console.log(1);
};
const confirm = async (id) => {
  console.log(id);
  const res = await delMenu({ id: id });
  if (res.errno === 0) {
    getList();
    message.success("删除成功");
  }
};
const onFinish = async (e) => {
  let res = {};
  if (formState.value.id) {
    res = await editMenu({
      ...e,
      pid: formState.value.pid,
      id: formState.value.id,
    });
  } else {
    res = await addMenu({ ...e, pid: formState.value.pid });
  }

  if (res.errno === 0) {
    message.success("操作成功");
    openMenu.value = false;
    getList();
  }
};

async function getList() {
  const { data } = await getMenuList();
  data.forEach((e) => {
    e.key = e.id;
    if (e.children) {
      e.children.forEach((item) => {
        item.key = item.id;
      });
    }
  });
  list.value = data;
  // tableKey.value = new Date().getTime();
}
const add = (record, pid) => {
  formState.value.pid = pid;
  openMenu.value = true;
};
const edit = (record, pid) => {
  // formState.value.pid = pid;

  formState.value = {
    id: record.id,
    pid: record.pid,
    name: record.name,
    type: record.type,
    title: record.title,
    uri: record.uri,
    icon: record.icon,
    slug: record.slug,
    sort: record.sort,
  };
  openMenu.value = true;
};

const afterClose = () => {
  formState.value = { ...initForm };
};

function normalizeNode(node) {
  return {
    name: node.name || "",
    type: Number(node.type || 1),
    title: node.title || "",
    uri: node.uri || "",
    icon: node.icon || "",
    slug: node.slug || "",
    sort: Number(node.sort || 0),
  };
}

function normalizeNodeForEdit(node) {
  const payload = normalizeNode(node);
  // 按需求：修改不处理 icon
  delete payload.icon;
  return payload;
}

function flattenWithParent(nodes = [], parentId = 0, out = []) {
  (nodes || []).forEach((node) => {
    out.push({
      ...node,
      pid: parentId,
    });
    if (node.children && node.children.length) {
      flattenWithParent(node.children, node.id, out);
    }
  });
  return out;
}

function nodeIdentity(node = {}) {
  return [
    Number(node.type || 1),
    String(node.title || ""),
    String(node.name || ""),
    String(node.uri || ""),
  ].join("|");
}

function pathSegment(node = {}) {
  const title = String(node.title || "").trim();
  if (title) return title;
  const uri = String(node.uri || "").trim();
  if (uri) return `__URI__${uri}`;
  return `__NAME__${String(node.name || "").trim()}`;
}

function flattenTarget(
  nodes = [],
  parentKey = "__ROOT__",
  parentPathKey = "__ROOT__",
  out = []
) {
  (nodes || []).forEach((node) => {
    const key = `${parentKey}=>${nodeIdentity(node)}`;
    const pathKey = `${parentPathKey}=>${pathSegment(node)}`;
    out.push({
      node,
      key,
      parentKey,
      pathKey,
      parentPathKey,
    });
    if (node.children && node.children.length) {
      flattenTarget(node.children, key, pathKey, out);
    }
  });
  return out;
}

function flatCurrent(listData = []) {
  const out = [];
  const walk = (arr, parentKey = "__ROOT__", parentPathKey = "__ROOT__") => {
    (arr || []).forEach((item) => {
      const key = `${parentKey}=>${nodeIdentity(item)}`;
      const pathKey = `${parentPathKey}=>${pathSegment(item)}`;
      out.push({
        id: item.id,
        pid: item.pid,
        key,
        pathKey,
        raw: item,
      });
      if (item.children && item.children.length) {
        walk(item.children, key, pathKey);
      }
    });
  };
  walk(listData);
  return out;
}

async function refreshCurrentList() {
  const { data } = await getMenuList();
  return data || [];
}

async function ensureByPath(targetItem) {
  const currentData = await refreshCurrentList();
  const allCurrent = flatCurrent(currentData);
  const hitByPath = allCurrent.find((e) => e.pathKey === targetItem.pathKey);

  let parentId = 0;
  if (targetItem.parentPathKey !== "__ROOT__") {
    const parent = allCurrent.find((e) => e.pathKey === targetItem.parentPathKey);
    if (!parent) return null;
    parentId = parent.id;
  }

  const payload = normalizeNode(targetItem.node);
  if (hitByPath) {
    const source = hitByPath.raw || {};
    const editPayload = normalizeNodeForEdit(targetItem.node);
    const needEdit =
      Number(source.type || 1) !== editPayload.type ||
      String(source.name || "") !== editPayload.name ||
      String(source.title || "") !== editPayload.title ||
      String(source.uri || "") !== editPayload.uri ||
      String(source.slug || "") !== editPayload.slug ||
      Number(source.sort || 0) !== editPayload.sort ||
      Number(source.pid || 0) !== Number(parentId);
    if (needEdit) {
      const res = await editMenu({
        id: hitByPath.id,
        pid: parentId,
        ...editPayload,
      });
      if (res.errno !== 0) {
        throw new Error(`更新失败: ${editPayload.title || editPayload.name}`);
      }
      return {
        id: hitByPath.id,
        action: "updated",
      };
    }
    return {
      id: hitByPath.id,
      action: "noop",
    };
  }

  const res = await addMenu({
    ...payload,
    pid: parentId,
  });
  if (res.errno !== 0) {
    throw new Error(`创建失败: ${payload.title || payload.name}`);
  }

  const latestData = await refreshCurrentList();
  const latestHit = flatCurrent(latestData).find(
    (e) => e.pathKey === targetItem.pathKey
  );
  return {
    id: latestHit?.id || null,
    action: "added",
  };
}

function itemDisplayName(item = {}) {
  const node = item.node || item.raw || {};
  return node.title || node.name || node.uri || String(item.id || "");
}

async function syncByMockRoutes() {
  if (syncLoading.value) return;
  syncLoading.value = true;
  try {
    const targetItems = flattenTarget(mockRoutes);
    const added = [];
    const updated = [];
    const deleted = [];

    // 1) 先按父子路径补齐缺失项（父级先于子级）
    for (const item of targetItems) {
      const result = await ensureByPath(item);
      const name = itemDisplayName(item);
      if (result?.action === "added") {
        added.push(name);
      } else if (result?.action === "updated") {
        updated.push(name);
      }
    }

    // 2) 删除 JSON 不存在的项（子级优先，避免父级先删失败）
    const latestData = await refreshCurrentList();
    const currentItems = flatCurrent(latestData);
    const targetPathSet = new Set(targetItems.map((e) => e.pathKey));
    const needDelete = currentItems
      .filter((e) => !targetPathSet.has(e.pathKey))
      .sort((a, b) => b.pathKey.length - a.pathKey.length);

    for (const item of needDelete) {
      const res = await delMenu({ id: item.id });
      if (res.errno !== 0) {
        throw new Error(`删除失败: ${item.raw?.name || item.raw?.title || item.id}`);
      }
      deleted.push(itemDisplayName(item));
    }

    syncReport.value = {
      time: new Date().toLocaleString(),
      added,
      updated,
      deleted,
    };
    await getList();
    message.success(syncSummaryText.value || "JSON 同步完成");
  } catch (error) {
    console.log(error);
    message.error(error?.message || "JSON 同步失败");
  } finally {
    syncLoading.value = false;
  }
}
</script>

<style lang="scss" scoped>
.sync-report {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;
}

.sync-report-title {
  margin-bottom: 10px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
}

.sync-section {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 8px 10px;
  min-height: 120px;
}

.sync-section-title {
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
}

.sync-list {
  margin: 0;
  padding-left: 16px;
  max-height: 180px;
  overflow: auto;
}

.sync-list li {
  line-height: 1.8;
  color: rgba(0, 0, 0, 0.75);
}
</style>
