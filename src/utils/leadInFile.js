import XLSX from 'xlsx-js-style'
import { message } from "ant-design-vue"
import { fileNames } from './preview.js'
/**
 * 读取 Excel/CSV 文件
 * @param {File} file - 要读取的文件对象
 * @param {Object} keyMap - 表头映射对象，格式：{ '表头中文名': '字段名' }
 * @returns {Promise<{name: string, data: Array, list: Array}>} 返回包含文件名、原始数据和转换后对象数组的对象
 */
export function readXLSX(file, keyMap, valueMap) {
  return new Promise((resolve, reject) => {
    // 验证文件格式（支持 xlsx、xls、csv）
    const nameSplit = file.name.split('.')
    const format = nameSplit[nameSplit.length - 1]?.toLowerCase()

    if (!['xlsx', 'xls', 'csv'].includes(format)) {
      message.warning('只能上传 xlsx、xls 或 csv 格式的文件')
      reject(new Error('不支持的文件格式'))
      return
    }

    // 创建文件读取器
    const reader = new FileReader()
    file.format = format
    if (format === 'csv') {
      // CSV 文件：使用文本方式读取
      reader.readAsText(file, 'UTF-8')
      reader.onload = function (evt) {
        try {
          const text = evt.target.result

          // 解析 CSV 文件
          const workbook = XLSX.read(text, {
            type: 'string',
          })

          processWorkbook(workbook, file, keyMap, valueMap, resolve, reject)
        } catch (error) {
          console.error('读取 CSV 文件失败:', error)
          message.warning('读取 CSV 文件失败，请检查文件格式是否正确')
          reject(error)
        }
      }
    } else {
      // Excel 文件：使用 ArrayBuffer 方式读取，避免编码问题
      reader.readAsArrayBuffer(file)

      reader.onload = function (evt) {
        try {
          const data = evt.target.result

          // 解析 Excel 文件，使用 array 类型可以正确处理中文
          // 添加选项确保合并单元格信息被保留
          const workbook = XLSX.read(data, {
            type: 'array',
            cellStyles: true,
            sheetStubs: true
          })

          processWorkbook(workbook, file, keyMap, valueMap, resolve, reject)
        } catch (error) {
          console.error('读取 Excel 文件失败:', error)
          message.warning('读取 Excel 文件失败，请检查文件格式是否正确')
          reject(error)
        }
      }
    }

    // 读取失败
    reader.onerror = function (error) {
      console.error('文件读取失败:', error)
      message.warning('文件读取失败，请重试')
      reject(error)
    }
  })
}

/**
 * 处理工作簿数据
 * @param {Object} workbook - XLSX 工作簿对象
 * @param {File} file - 文件对象
 * @param {Object} keyMap - 表头映射对象
 * @param {Function} resolve - Promise resolve
 * @param {Function} reject - Promise reject
 */
function processWorkbook(workbook, file, keyMap, valueMap, resolve, reject) {
  try {
    // 检查是否有工作表
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      message.warning('文件中没有工作表')
      reject(new Error('文件中没有工作表'))
      return
    }

    // 读取第一个工作表
    const wsname = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[wsname]

    // 转换为二维数组格式
    const ws = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      raw: file.format !== 'csv'
    })
    // 处理原始数据（清除空格）
    const processedData = ws.map(row => {
      if (!row) return row
      return row.map(cell => typeof cell === 'string' ? cell.trim() : cell)
    })


    // 获取合并单元格信息（仅从 !merges 属性获取）
    const mergedCells = worksheet['!merges'] || worksheet['!merge'] || []



    // 根据 keyMap 生成对象数据返回新的数组
    if (keyMap && typeof keyMap === 'object' && processedData.length > 0) {
      // 第一行是表头，读取时直接处理空格
      const headers = processedData[0].map(header => typeof header === 'string' ? header.trim() : header)

      // 建立表头索引到字段名的映射
      const headerIndexMap = {}
      headers.forEach((header, index) => {
        if (header && keyMap[header]) {
          headerIndexMap[index] = keyMap[header]
        }
      })
      //模版格式错误
      if (Object.keys(headerIndexMap).length === 0) {
        message.warning('文件格式错误，请检查表头是否正确')
        reject(new Error('文件格式错误，请检查表头是否正确'))
        return
      }

      // 从第二行开始转换数据（使用处理后的数据）
      const list = []
      for (let i = 1; i < processedData.length; i++) {
        const row = processedData[i]
        // 跳过空行
        if (!row || row.every(cell => {
          const trimmed = typeof cell === 'string' ? cell.trim() : cell
          return trimmed === '' || trimmed === null || trimmed === undefined
        })) {
          continue
        }

        const obj = {}
        row.forEach((cell, index) => {
          const fieldName = headerIndexMap[index]

          if (fieldName) {
            // 处理数据时直接清除空格
            let value = cell !== undefined && cell !== null ? cell : ''
            if (typeof value === 'string') {
              value = value.trim()
            }
            // 如果 valueMap 存在，进行值映射
            if (valueMap && typeof valueMap === 'object' && valueMap[fieldName]) {
              value = valueMap[fieldName][value] || value
            }
            obj[fieldName] = value
          }
        })
        list.push(obj)
      }
      const getMergeInfo = (str = '') => {
        let cellIndex = 0
        if (str) {
          cellIndex = headers.findIndex((header) => header === str)
        }
        if (cellIndex < 0) return null
        let obj = null
        if (mergedCells && mergedCells.length > 0) {
          obj = {}
          mergedCells.forEach(merge => {
            const { s, e } = merge // s: 起始位置, e: 结束位置
            // 只检查第一列的合并：s.c === 0
            if (e.c === cellIndex) {
              // 取出 r（行号）
              const startRow = s.r
              const endRow = e.r

              // 以起始行号为键，存储 [起始行, 结束行] 数组
              obj[startRow] = [startRow, endRow]
            }
          })
        }
        return obj
      }

      const mergeInfo = getMergeInfo('调整金额')

      // 根据 mergeInfo 处理合并数据，创建新的列表（原 list 不动）
      // 深拷贝原 list，避免循环引用
      let processedList = list

      if (false && mergeInfo && Object.keys(mergeInfo).length > 0) {
        // 从后往前处理，避免删除时索引变化
        const sortedKeys = Object.keys(mergeInfo).map(Number).sort((a, b) => b - a)

        sortedKeys.forEach(startRow => {
          const [start, end] = mergeInfo[startRow]
          // list 数组从第1行数据开始（索引0对应原数据的第1行），所以需要减1
          const listStartIndex = start - 1
          const listEndIndex = end - 1

          // 找到对应的数据对象（processedList 中的索引对应原数据的行号减1）
          if (listStartIndex >= 0 && listStartIndex < processedList.length) {
            const targetItem = processedList[listStartIndex]

            // 提取合并范围内的数据（从原 list 中深拷贝，避免循环引用）
            const mergedList = []
            for (let i = listStartIndex; i <= listEndIndex && i < list.length; i++) {
              mergedList.push(JSON.parse(JSON.stringify(list[i])))
            }

            // 在目标数据对象上添加 list 字段
            if (targetItem) {
              targetItem.mergedList = mergedList
            }

            // 删除合并范围内的其他行（保留第一行）
            for (let i = listEndIndex; i > listStartIndex; i--) {
              processedList.splice(i, 1)
            }
          }
        })
      }
      if (!processedList.length) {
        message.warning('文件内容为空')
      }
      // 返回结果
      const result = {
        name: fileNames(file.name)[0],
        data: processedData,
        mergeInfo: mergeInfo,
        processedList: processedList // 处理后的新列表
      }
      resolve(result)
    } else {
      // 如果没有 keyMap，list 为空数组
      message.warning('文件内容为空')
      resolve({
        list: []
      })
    }



  } catch (error) {
    console.error('处理工作簿失败:', error)
    message.warning('处理文件数据失败')
    reject(error)
  }
}
