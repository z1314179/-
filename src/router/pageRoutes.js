export const pageRoutes = [
  // 详情务必使用{{动态id}}，否则会报错
  {
    path: '/home/NoticeCenter',
    name: '通知中心',
    component: () => import("@/views/Home/NoticeCenter.vue"),
    meta: {}
  },
  {
    path: '/home/WarningCenter',
    name: '预警中心',
    component: () => import("@/views/Home/WarningCenter.vue"),
    meta: {}
  },
  {
    path: '/basic/template/edit',
    name: '模版编辑',
    component: () => import("@/views/Basic/Template/Edit.vue"),
    meta: {
      parentPath: '/basic/template',
      keepAlive: true,
      type: 'edit'
    }
  },
  {
    path: '/basic/template/detail',
    name: '模版详情',
    component: () => import("@/views/Basic/Template/Detail.vue"),
    meta: {
      parentPath: '/basic/template',
      keepAlive: true,
    }
  },
  {
    path: '/contract/intention/edit',
    name: '意向合同编辑',
    component: () => import("@/views/Contract/Intention/Edit.vue"),
    meta: {
      parentPath: '/contract/intention',
      keepAlive: true,
      type: 'edit'
    }
  },
  {
    path: '/contract/intention/detail',
    name: '意向合同详情',
    component: () => import("@/views/Contract/Intention/Detail.vue"),
    meta: {
      parentPath: '/contract/intention',
      keepAlive: true,
    }
  },
  {
    path: '/contract/lifecycle/edit',
    name: '合同编辑',
    component: () => import("@/views/Contract/Lifecycle/Edit.vue"),
    meta: {
      parentPath: '/contract/lifecycle',
      keepAlive: true,
    }
  },
  {
    path: '/contract/lifecycle/detail',
    name: '合同详情',
    component: () => import("@/views/Contract/Lifecycle/Detail.vue"),
    meta: {
      parentPath: '/contract/lifecycle',
      keepAlive: true,
    }
  },
  {
    path: '/digital/ledger/add',
    name: '资产新增',
    component: () => import("@/views/Digital/Ledger/LedgerForm.vue"),
    meta: {
      parentPath: '/digital/ledger',
      keepAlive: true,
      type: 'add'
    }
  },
  {
    path: '/digital/ledger/edit',
    name: '资产编辑',
    component: () => import("@/views/Digital/Ledger/LedgerForm.vue"),
    meta: {
      parentPath: '/digital/ledger',
      keepAlive: true,
      type: 'edit'
    }
  },
  {
    path: '/digital/ledger/LedgerDetails',
    name: '资产详情',
    component: () => import("@/views/Digital/Ledger/LedgerDetails.vue"),
    meta: {
      parentPath: '/digital/ledger',
      keepAlive: true,
      type: 'details'
    }
  },
  {
    path: '/settings/company/edit',
    name: '编辑公司',
    component: () => import("@/views/Settings/Company/Edit.vue"),
    meta: {
      parentPath: '/settings/company',
      keepAlive: true,
    }
  },
  {
    path: '/settings/department/edit',
    name: '编辑部门',
    component: () => import("@/views/Settings/Department/Edit.vue"),
    meta: {
      parentPath: '/settings/department',
      keepAlive: true,
    }
  },
  {
    path: '/basic/customer/add',
    name: '新增客商',
    component: () => import("@/views/Basic/Customer/CustomerForm.vue"),
    meta: {
      parentPath: '/basic/customer',
      keepAlive: true,
      type: 'add'
    }
  },
  {
    path: '/basic/customer/edit',
    name: '修改客商',
    component: () => import("@/views/Basic/Customer/CustomerForm.vue"),
    meta: {
      parentPath: '/basic/customer',
      keepAlive: true,
      type: 'edit'
    }
  },
  {
    path: '/basic/customer/CustomerDetails',
    name: '客商详情',
    component: () => import("@/views/Basic/Customer/CustomerDetails.vue"),
    meta: {
      parentPath: '/basic/customer',
      keepAlive: true,
      type: 'details'
    }
  },
  {
    path: '/contract/borrowing/add',
    name: '发起借阅申请',
    component: () => import("@/views/Contract/Borrowing/BorrowingForm.vue"),
    meta: {
      parentPath: '/contract/borrowing',
      keepAlive: true,
      type: 'add'
    }
  },
  {
    path: '/contract/borrowing/edit',
    name: '编辑借阅申请',
    component: () => import("@/views/Contract/Borrowing/BorrowingForm.vue"),
    meta: {
      parentPath: '/contract/borrowing',
      keepAlive: true,
      type: 'edit'
    }
  },
  {
    path: '/contract/borrowing/BorrowingDetails',
    name: '借阅详情',
    component: () => import("@/views/Contract/Borrowing/BorrowingDetails.vue"),
    meta: {
      parentPath: '/contract/borrowing',
      keepAlive: true,
      type: 'details'
    }
  },
  {
    path: '/settings/company/CompanyDetails',
    name: '公司详情',
    component: () => import("@/views/Settings/Company/CompanyDetails.vue"),
    meta: {
      parentPath: '/settings/company',
      keepAlive: true,
      type: 'details'
    }
  },
]