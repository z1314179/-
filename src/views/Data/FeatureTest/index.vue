<template>
  <div class="pdf-hidden1" ref="pdfRef">
    <a-button type="primary" class="extract-btn" @click="handleExtractDomCss">
      提取DOM+CSS
    </a-button>
    <div id="dom-pdf" ref="imgRef">
      <div class="dom-pdf-title">订购合同</div>
      <div class="border-row border-top">
        <div class="border-col">合同编号：{{ formState.contractNo }}</div>
        <div class="border-col">合同负责人：{{ formState._name }}</div>
        <div class="border-col" v-if="formState.isFrameworkContract == 1">框架合同：{{
          formState.masterContractNo && formState.masterContractNo.join("、")
          }}</div>
        <div class="border-col">签署日期：{{ formState.signDate }}</div>
        <div class="border-col">合同签署地：{{ formState.signPlace }}</div>
        <div class="border-col">甲方（采购方）：{{ formState.purchaser }}</div>
        <div class="border-col">乙方（供应方）：{{ formState.supplierName }}</div>
        <div class="border-col">法定代表人：{{ formState.purchaserLegalPerson }}</div>
        <div class="border-col">法定代表人：{{ formState.supplierLegalPerson }}</div>
        <div class="border-col">联系人：{{ formState.purchaserContacts }}</div>
        <div class="border-col">联系人：{{ formState.supplierContacts }}</div>
        <div class="border-col">联系电话：{{ formState.purchaserContactNumber }}</div>
        <div class="border-col">联系电话：{{ formState.supplierContactNumber }}</div>
        <div class="border-col">电子邮箱：{{ formState.purchaserEmail }}</div>
        <div class="border-col">电子邮箱：{{ formState.supplierEmail }}</div>
        <div class="border-col">通讯地址：{{ formState.purchaserMailAddress }}</div>
        <div class="border-col">通讯地址：{{ formState.supplierMailAddress }}</div>
        <div class="border-col">通讯地址：{{ formState.supplierMailAddress }}</div>
        <div class="border-col">通讯地址：{{ formState.supplierMailAddress }}</div>
        <div class="border-col">通讯地址：{{ formState.supplierMailAddress }}</div>
        <div class="border-col">通讯地址：{{ formState.supplierMailAddress }}</div>
        <div class="border-col">通讯地址：{{ formState.supplierMailAddress }}</div>
        <div class="border-col">通讯地址：{{ formState.supplierMailAddress }}</div>
        <div class="border-col">通讯地址：{{ formState.supplierMailAddress }}</div>
        <div class="border-col">通讯地址：{{ formState.supplierMailAddress }}</div>
        <div class="border-col">通讯地址：{{ formState.supplierMailAddress }}</div>
        <div class="border-col">通讯地址：{{ formState.supplierMailAddress }}</div>
        <div class="border-col">通讯地址：{{ formState.supplierMailAddress }}</div>
        <div class="border-col">通讯地址：{{ formState.supplierMailAddress }}</div>
        <div class="border-col">通讯地址：{{ formState.supplierMailAddress }}</div>
        <div class="border-col">通讯地址：{{ formState.supplierMailAddress }}</div>
        <div class="border-col">通讯地址：{{ formState.supplierMailAddress }}</div>
        <div class="border-col">通讯地址：{{ formState.supplierMailAddress }}</div>
        <div class="border-col">通讯地址：{{ formState.supplierMailAddress }}</div>
        <div class="border-col">通讯地址：{{ formState.supplierMailAddress }}</div>
        <div class="border-col">通讯地址：{{ formState.supplierMailAddress }}</div>
        <div class="border-col">通讯地址：{{ formState.supplierMailAddress }}</div>
        <div class="border-col">通讯地址：{{ formState.supplierMailAddress }}</div>
        <div class="border-col">通讯地址：{{ formState.supplierMailAddress }}</div>
        <div class="border-col">通讯地址：{{ formState.supplierMailAddress }}</div>
        <div class="border-col">通讯地址：{{ formState.supplierMailAddress }}</div>
        <div class="border-col">通讯地址：{{ formState.supplierMailAddress }}</div>
        <div class="border-col">通讯地址：{{ formState.supplierMailAddress }}</div>
        <div class="border-col">通讯地址：{{ formState.supplierMailAddress }}</div>
        <div class="border-col">通讯地址：{{ formState.supplierMailAddress }}</div>
        <div class="border-col">通讯地址：{{ formState.supplierMailAddress }}</div>
        <div class="border-col">通讯地址：{{ formState.supplierMailAddress }}</div>
        <div class="border-col">通讯地址：{{ formState.supplierMailAddress }}</div>
        <div class="border-col">通讯地址：{{ formState.supplierMailAddress }}</div>
        <div class="border-col">通讯地址：{{ formState.supplierMailAddress }}</div>
      </div>
      <div class="dom-row-tip">
        鉴于甲方有意向乙方采购相应产品 ，且乙方有能力供应相应产品
        ，根据《中华人民共和国民法典 》和相关法律法规的规定 ，双方本着诚实守信
        、公平合理、互惠互利、共同发展的基础上
        ，就乙方向甲方供应产品达成如下共识，以兹共同遵守 。
      </div>
      <div class="border-row border-top">
        <div class="border-col dom-row-title">付款信息</div>
        <div class="border-col">结算方式：{{ formState.settleType }}</div>
        <div class="border-col">账户名称：{{ formState.accountName }}</div>
        <div class="border-col">开户行：{{ formState.openBank }}</div>
        <div class="border-col" style="width: 100%;">银行账号：{{ formState.bankCardNumber }}</div>
      </div>
    </div>
  </div>
</template>
<script setup>
defineOptions({
  name: "pdfHtml",
});
import { ref } from "vue";
import { message } from "ant-design-vue";
import useDomPdf from "@/hook/business/useDomPdf";
import { downLoadObj } from "@/utils/preview";

const formState = ref({});
const pdfRef = ref(null);
const { generatePdfFromDom } = useDomPdf();


async function handleExtractDomCss() {
  try {
    const result = await generatePdfFromDom("#dom-pdf", {
      selectors: ["#dom-pdf"],
      filename: "dom.pdf",
      pdfOptions: { format: "A4", printBackground: true },
    });
    console.log("dom-pdf提取结果:", { dom: result.dom, css: result.css });
    downLoadObj(result.blob, "dom.pdf");
  } catch (error) {
    message.error(error?.message || "生成 PDF 失败");
  }
}

</script>

<style lang="scss" scoped>
.pdf-line {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 3px;
  // background: skyblue;
  height: 1157px;
  border: 1px solid;
}

#dom-pdf {
  font-weight: 400;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.85);
  width: 800px;

  .dom-pdf-title {
    font-weight: 600;
    font-size: 18px;
    color: #000000;
    text-align: center;
  }

  .dom-row-tip {
    font-weight: 500;
    font-size: 12px;
    color: #000000;
    padding: 10px 0;

    &::before {
      content: "*";
      color: #000;
    }
  }

  .dom-row-title {
    font-weight: 500;
    font-size: 12px;
    color: #000000;
  }

  .border-col {
    font-size: 12px;
    border-left: 1px solid #000;
    border-bottom: 1px solid #000;
    padding: 8px 4px;
    word-break: break-all;
    width: 50%;
    box-sizing: border-box;
  }

  .border-row {
    border-right: 1px solid #000;
    display: flex;
    flex-wrap: wrap;
  }

  .border-top {
    border-top: 1px solid #000;
  }
}
</style>
