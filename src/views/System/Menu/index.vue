<template>
  <div class="menu-page page-content">
    <a-card title="菜单管理" :bordered="false">
      <template #extra>
        <a-space>
          <a-button type="primary" @click="handleAdd">新增菜单</a-button>
          <a-button @click="handleRefresh">刷新</a-button>
        </a-space>
      </template>

      <a-table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="false"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'type'">
            <a-tag :color="record.type === 1 ? 'blue' : 'green'">
              {{ record.type === 1 ? '菜单' : '按钮' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 1 ? 'green' : 'red'">
              {{ record.status === 1 ? '启用' : '禁用' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
              <a-button type="link" size="small" danger @click="handleDelete(record)">删除</a-button>
            </a-space>
          </template>
        </template>
      </a-table>

    </a-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { message } from 'ant-design-vue'

defineOptions({
  name: 'MenuManagement'
})

const loading = ref(false)

const columns = [
  { title: '菜单名称', dataIndex: 'name', key: 'name' },
  { title: '路径', dataIndex: 'path', key: 'path' },
  { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
  { title: '排序', dataIndex: 'sort', key: 'sort', width: 80 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 150 }
]

const dataSource = ref([
  {
    id: 2,
    name: '系统管理',
    path: '/system',
    type: 1,
    sort: 2,
    status: 1,
    children: [
      {
        id: 21,
        name: '用户管理',
        path: '/system/user',
        type: 1,
        sort: 1,
        status: 1
      },
      {
        id: 22,
        name: '角色管理',
        path: '/system/role',
        type: 1,
        sort: 2,
        status: 1
      },
      {
        id: 23,
        name: '菜单管理',
        path: '/system/menu',
        type: 1,
        sort: 3,
        status: 1
      }
    ]
  }
])

const handleAdd = () => {
  message.info('新增菜单功能（Mock 模式）')
}

const handleEdit = (record) => {
  message.info(`编辑菜单：${record.name}（Mock 模式）`)
}

const handleDelete = (record) => {
  message.warning(`删除菜单：${record.name}（Mock 模式）`)
}

const handleRefresh = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    message.success('刷新成功')
  }, 500)
}

</script>

<style lang="scss" scoped>
.menu-page {
  :deep(.ant-card) {
    border-radius: 8px;
  }
}
</style>
