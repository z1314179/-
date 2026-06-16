import { getPdfHtml } from "@/api/node";

function normalizeToNativeCss(cssText) {
  if (!cssText) return "";
  return cssText
    .replace(/\[data-v-[a-z0-9-]+\]/gi, "")
    .replace(/::v-deep\s*/g, "")
    .replace(/:deep\((.*?)\)/g, "$1")
    .replace(/:where\((.*?)\)/g, "$1")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/,\s+/g, ", ")
    .trim();
}

function collectRelatedCssTexts(selectors = []) {
  const cssTexts = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch (e) {
      continue;
    }
    if (!rules) continue;
    for (const rule of Array.from(rules)) {
      const text = rule?.cssText || "";
      if (!text) continue;
      if (selectors.some((selector) => text.includes(selector))) {
        cssTexts.push(text);
      }
    }
  }
  return normalizeToNativeCss(cssTexts.join("\n"));
}

export default function useDomPdf() {
  const generatePdfFromDom = async (target, options = {}) => {
    const {
      selectors = ["#dom-pdf"],
      filename = "dom.pdf",
      pdfOptions = { format: "A4", printBackground: true },
    } = options;

    let domNode = target;
    if (typeof target === "string") {
      domNode = document.querySelector(target);
    }
    if (!domNode) {
      throw new Error("未找到可生成 PDF 的 DOM 节点");
    }

    const dom = domNode.outerHTML;
    const css = collectRelatedCssTexts(selectors);
    const blob = await getPdfHtml({
      html: dom,
      css,
      filename,
      pdfOptions,
    });

    return { dom, css, blob };
  };

  return { generatePdfFromDom };
}
