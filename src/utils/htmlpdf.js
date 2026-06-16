import html2canvas from "html2canvas";
import JSPDF from "jspdf";

/**
 * 导出页面为PDF格式
 * @param {Object} options 配置对象
 */
export function handlePdf({
  elementName,
  pdfname = "export",
  width,
  imgH = {},
  doms,
  orientation = "p",
  padding = 10
}) {
  const element = elementName
    ? document.querySelector("#" + elementName)
    : doms;

  if (!element) return Promise.reject("未找到要导出的元素");

  const renderWidth = width || 800;
  const { a4w } = a4height({ renderWidth, orientation, padding })
  return new Promise((resolve, reject) => {
    const pdf = new JSPDF(orientation, "mm", "a4");
    // 使用 jsPDF.html 生成文本优先的 PDF（不再整页截图 addImage）
    pdf.html(element, {
      x: padding,
      y: padding,
      width: a4w,
      windowWidth: renderWidth,
      autoPaging: "text",
      html2canvas: {
        useCORS: true,
        logging: false,
        scale: 1,
      },
      callback: (doc) => {
        const blob = doc.output("blob");
        const file = convertBlobToFile(blob, `${pdfname}.pdf`);
        resolve(file);
      },
    }).catch(err => reject(err));
  });
}

/**
 * base64 转 File
 * @param {string} urlData base64数据
 * @param {string} filename 文件名
 */
function convertBase64ToFile(urlData, filename) {
  const arr = urlData.split("base64,");
  const type = arr[0].match(/:(.*?);/)[1];
  const fileExt = type.split("/")[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], `${filename}.${fileExt}`, { type });
}

function convertBlobToFile(blob, filename) {
  return new File([blob], filename, { type: "application/pdf" });
}
/**
 * 计算A4页面高度
 * @param {Object} options 配置对象
 */
export function a4height({ renderWidth = 800, orientation = 'p', padding = 10 }) {
  // === A4 标准尺寸（mm）===
  const A4_WIDTH = orientation === "l" ? 297 : 210;
  const A4_HEIGHT = orientation === "l" ? 210 : 297;

  // 去掉 padding 后的可用区域
  const a4w = A4_WIDTH - padding * 2;
  const a4h = A4_HEIGHT - padding * 2;

  // 每页在 canvas 中可渲染的高度（px）
  const pageHeightPx = Math.floor(renderWidth * (a4h / a4w));


  return { pageHeightPx, a4w, a4h };
}
/**
 * 处理表格分页
 * @param {HTMLElement} dom DOM元素
 * @param {Object} obj 配置对象
 */
export function handleTableX(dom, obj = {}) {
  const pHeight = dom.getBoundingClientRect().top
  const { pageHeightPx } = a4height(obj)
  const tableDom = dom.querySelectorAll('.pdf-table')
  for (const element of tableDom) {
    handleRow(element, pHeight, pageHeightPx)
  }
}
/**
 * 处理表格行
 * @param {HTMLElement} tableDom 表格DOM
 * @param {number} pHeight 高度
 * @param {number} pageHeightPx 页面高度
 */
function handleRow(tableDom, pHeight, pageHeightPx) {
  let _h = pageHeightPx
  tableDom.querySelectorAll('.pdf-table-row').forEach((row, index) => {
    // 当前 row 相对于 parentDom 的顶部距离
    const rowH = row.getBoundingClientRect().height
    const rowTop = row.getBoundingClientRect().top - pHeight + rowH
    const re = rowTop > _h
    if (re) {

      let ropMatgin = _h - rowTop + rowH
      row.style.marginTop = `${ropMatgin + 1}px`;
      row.classList.add("border-top");
      _h += pageHeightPx
    }

  })
}