import * as XLSXS from 'xlsx-js-style';

/**
 * 导出 Excel 文件
 * @param {Object} data 导出数据对象
 * @param {Function} [handler] 处理函数
 */
export const exportExcel = (data, handler) => {
  if (!data || !data.data || !Array.isArray(data.data)) {
    throw new Error('数据格式错误：data.data 必须是二维数组')
  }
  
  // 将二维数组转换为工作表
  const sheet = XLSXS.utils.aoa_to_sheet(data.data)
  
  // 创建新的工作簿
  const workbook = XLSXS.utils.book_new()
  
  // 如果提供了处理函数，允许自定义样式等
  if (handler && typeof handler === 'function') {
    handler(sheet)
  }
  
  // 将工作表添加到工作簿
  XLSXS.utils.book_append_sheet(workbook, sheet, 'sheet名称')
  
  // 将工作簿转换为二进制数组
  const wbout = XLSXS.write(workbook, {
    bookType: 'xlsx',
    bookSST: false,
    type: 'array',
  })
  
  // 创建 Blob 对象
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  
  // 创建 File 对象并返回
  const file = new File([blob], data.name || 'export', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  
  return file
}