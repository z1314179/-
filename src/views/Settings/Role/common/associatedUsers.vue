<template>
  <a-drawer
    class="associated-users"
    title="关联用户"
    :open="associatedOpen"
    placement="right"
    width="750"
    @close="close"
    @after-open-change="afterOpenChange"
  >
    <div class="flex" style="height: 100%">
      <div class="is-left">
        <a-input-search
          class="mg-b-large"
          v-model:value="searchValue"
          placeholder="请输入部门或用户名"
          style="padding-right: 4px"
        />
        <a-tree
          ref="treeRef"
          class="is-tree"
          :expandedKeys="expandedKeys"
          :fieldNames="replaceFields"
          :auto-expand-parent="autoExpandParent"
          @expand="onExpand"
          :tree-data="treeData"
          show-line
        >
          <template #title="row">
            <div class="flex">
              <div class="is-level">
                <i class="iconfont icon-bumen" />
                <span v-if="row.name.indexOf(searchValue) > -1">
                  {{ row.name.substr(0, row.name.indexOf(searchValue)) }}
                  <span style="color: #ee245e; font-weight: 500">{{
                    searchValue
                  }}</span>
                  {{
                    row.name.substr(
                      row.name.indexOf(searchValue) + searchValue.length
                    )
                  }}<span v-if="!row.userId">（{{ row.count }}）</span>
                </span>
                <span v-else
                  >{{ row.name
                  }}<span v-if="!row.userId">（{{ row.count }}）</span></span
                >
              </div>
              <div v-if="row.userId" class="mg-l-1" style="text-align: right">
                <span
                  style="color: rgba(0, 0, 0, 0.4)"
                  v-if="selectUser.some((e) => e.id == row.id)"
                >
                  已添加
                </span>
                <a-button
                  type="link"
                  v-else
                  :disabled="row.id == 5"
                  @click="addUsers($event, row)"
                >
                  添加
                </a-button>
              </div>
            </div>
          </template>
        </a-tree>
      </div>
      <a-divider type="vertical" style="border-color: #e7e7e7; height: auto" />
      <div class="is-right">
        <div class="flex">
          <span class="is-level" style="font-weight: 500"
            >已选择的的用户（{{ selectUser.length }}）</span
          >
          <a-button
            class="is-btn-clean"
            v-if="selectUser.length > 0"
            size="small"
            @click="cleanBtn('all')"
            >清 空</a-button
          >
        </div>
        <div class="flex mg-t-medium" v-for="(l, k) in selectUser" :key="k">
          <span class="is-level ellipsis">{{ l.name }}</span>
          <a-button type="link" size="small" @click="cleanBtn('one', k)"
            >移除</a-button
          >
        </div>
      </div>
    </div>
    <template #footer>
      <a-button type="info" class="mg-r-medium" @click="close">取 消</a-button>
      <a-button type="primary" @click="onSave">保 存</a-button>
    </template>
  </a-drawer>
</template>

<script setup>
import { getDepartmentList } from "@/api/users";
import { batchUpdateUsersRole } from "@/api/roles";
import { ref, reactive, computed, watch } from "vue";
import { message } from "ant-design-vue";
defineOptions({
  name: "associatedUsers",
});
const props = defineProps({
  associatedOpen: {
    type: Boolean,
    default: false,
  },
  config: {
    type: Object,
    default: {
      id: null,
      usersList: [],
    },
  },
});
const replaceFields = {
  children: "children",
  title: "name",
  key: "keyId",
};
const searchValue = ref("");
const expandedKeys = ref([]);
const autoExpandParent = ref(true);
const dataList = ref([]);
const treeData = ref([]);
const selectUser = ref([]);
const $emit = defineEmits(["update:associatedOpen", "change"]);
const onSave = async () => {
  // if (!selectUser.value.length) {
  //   return message.warning("请选择关联的用户！");
  // }
  const params = {
    roleId: props.config.id,
    userIds: selectUser.value.map((item) => item.id),
  };
  const res = await batchUpdateUsersRole(params);
  if (res.errno === 0) {
    message.success("关联成功！");
    close();
    $emit("change");
  }
};
const close = () => {
  expandedKeys.value = [];
  treeData.value = [];
  dataList.value = [];
  searchValue.value = "";
  $emit("update:associatedOpen", false);
};
const addUsers = async (e, row) => {
  selectUser.value.push({ name: row.name, id: row.id });
};
const cleanBtn = (type, inx) => {
  if (type === "all") {
    selectUser.value = [];
  } else {
    selectUser.value.splice(inx, 1);
  }
};
const handleData = (arr, list = []) => {
  arr.forEach((e, i) => {
    e.keyId = `${e.pid}-${e.id}`;
    list.push({ ...e });
    if (!e.children) e.children = [];
    if (e.users) {
      e.children.push(
        ...e.users.map((c) => {
          return {
            id: c.id,
            name: c.username,
            keyId: `user-${c.id}`,
            userId: true,
          };
        })
      );
    }
    if (e.children && e.children.length) {
      expandedKeys.value.push(e.keyId);
      handleData(e.children, list);
    }
  });
  return { arr: arr, list: list };
};
const afterOpenChange = async (visible) => {
  if (!visible) return;
  const { data } = await getDepartmentList();
  const { arr, list } = await handleData(data || [], []);
  treeData.value = arr;
  dataList.value = list;
  selectUser.value = props.config.usersList.map((e) => {
    return { name: e.username, id: e.id, keyId: `user-${e.id}` };
  });
};
const getDepList = async () => {
  const { data } = await getDepartmentList();
  const { arr, list } = await handleData(data || [], []);
  treeData.value = arr;
  dataList.value = list;
};
getDepList();
// })
const getParentKey = (keyId, tree) => {
  let parentKey;
  for (let i = 0; i < tree.length; i++) {
    const node = tree[i];
    if (node.children) {
      if (node.children.some((item) => item.keyId === keyId)) {
        parentKey = node.keyId;
      } else if (getParentKey(keyId, node.children)) {
        parentKey = getParentKey(keyId, node.children);
      }
    }
  }
  return parentKey;
};
const onExpand = (keys) => {
  expandedKeys.value = keys;
  autoExpandParent.value = false;
};
watch(
  searchValue,
  (value) => {
    const expanded = dataList.value
      .map((item) => {
        if (item.name.indexOf(value) > -1) {
          return getParentKey(item.keyId, treeData.value);
        }
        return null;
      })
      .filter((item, i, self) => item && self.indexOf(item) === i);
    expandedKeys.value = expanded;
    searchValue.value = value;
    autoExpandParent.value = true;
  },
  {
    immediate: true,
  }
);
</script>

<style lang="scss" scoped>
.associated-users {
  position: relative;
  .ellipsis {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .is-left {
    width: 385px;
    padding: 24px;
    background: #f4f6fd;
    border-radius: 8px;
    overflow: auto;
    height: 100%;
    :deep(.is-tree) {
      background: #f4f6fd;
      .ant-tree-treenode {
        padding-bottom: 0;
        width: -webkit-fill-available;
        font-weight: 400;
        font-size: 14px;
        color: rgba(0, 0, 0, 0.6);
        &:nth-child(1) {
          font-weight: 500;
          font-size: 14px;
          color: #4a4b4d;
        }
      }
      .ant-tree-switcher {
        line-height: 38px;
      }
      .ant-tree-node-content-wrapper {
        flex: 1;
        // padding: 6px 0px 6px 4px;
        padding: 6px 4px;
        &:hover {
          background: rgba(22, 80, 255, 0.04);
          border-radius: 2px;
        }
      }
      .anticon-file {
        svg {
          display: none;
        }
      }
      .ant-tree-treenode-selected {
        color: var(--color-primary);
      }
    }
  }
  .is-right {
    border-radius: 8px;
    border: 1px solid #e7e7e7;
    flex: 1;
    padding: 75px 24px 24px;
    position: relative;
    overflow: auto;
    height: 100%;
  }
  .is-level {
    line-height: 24px;
    height: 24px;
    flex: 1;
  }
  .is-btn-clean {
    height: 24px;
    line-height: 24px;
  }
}
</style>
