/** 与 FormDrag 导出结构一致，供动态表单页默认展示 */
export const defaultFormSchema = {
  name: '项目审批申请单',
  description: '项目立项审批流程',
  formComponents: [
    {
      componentType: 'TextField',
      props: {
        fieldName: 'contractNo',
        label: '合同编号',
        required: true,
        placeholder: '请输入合同编号'
      }
    },
    {
      componentType: 'TextField',
      props: {
        fieldName: 'contractOwner',
        label: '合同负责人',
        required: true,
        placeholder: '请输入负责人'
      }
    },
    {
      componentType: 'SelectField',
      props: {
        fieldName: 'contractType',
        label: '合同类型',
        required: true,
        placeholder: '请选择合同类型',
        options: [
          { value: 'purchase', label: '采购合同' },
          { value: 'sales', label: '销售合同' },
          { value: 'service', label: '服务合同' },
          { value: 'other', label: '其他' }
        ]
      }
    },
    {
      componentType: 'MultiSelectField',
      props: {
        fieldName: 'contactUserIds',
        label: '联系人',
        required: false,
        placeholder: '请选择联系人（可多选）',
        options: [
          { value: 'user_001', label: '张三' },
          { value: 'user_002', label: '李四' },
          { value: 'user_003', label: '王五' },
          { value: 'user_004', label: '赵六' }
        ]
      }
    },
    {
      componentType: 'DateField',
      props: {
        fieldName: 'signDate',
        label: '签署日期',
        required: true,
        format: 'yyyy-MM-dd'
      }
    },
    {
      componentType: 'TextField',
      props: {
        fieldName: 'signPlace',
        label: '合同签署地',
        required: true,
        placeholder: '请输入合同签署地'
      }
    },
    {
      componentType: 'TextField',
      props: {
        fieldName: 'deliveryPlace',
        label: '交货地点',
        required: false,
        placeholder: '请输入交货地点'
      }
    }
  ]
}

export function initFormValues(formComponents) {
  const state = {}
  if (!Array.isArray(formComponents)) return state
  for (const comp of formComponents) {
    const field = comp?.props?.fieldName
    if (!field) continue
    if (comp.componentType === 'MultiSelectField') {
      state[field] = []
    } else if (comp.componentType === 'RangeDateField') {
      state[field] = []
    } else if (comp.componentType === 'DateField') {
      state[field] = null
    } else {
      state[field] = undefined
    }
  }
  return state
}
