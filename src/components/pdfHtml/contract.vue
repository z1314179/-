<template>
  <div class="pdf-hidden" ref="pdf">
    <div class="pdf-line"></div>
    <div id="dom-pdf" ref="imgRef">
      <div class="dom-pdf-title">订购合同</div>
      <a-row class="border-row border-top mg-t-1">
        <a-col :span="12" class="border-col">合同编号：{{ formState.contractNo }}</a-col>
        <a-col :span="12" class="border-col">合同负责人：{{ formState._name }}</a-col>
        <a-col :span="12" class="border-col" v-if="formState.isFrameworkContract == 1">框架合同：{{
          formState.masterContractNo && formState.masterContractNo.join("、")
          }}</a-col>
        <a-col :span="12" class="border-col">签署日期：{{ formState.signDate }}</a-col>
        <a-col :span="12" class="border-col">合同签署地：{{ formState.signPlace }}</a-col>
        <a-col :span="formState.isFrameworkContract == 1 ? 12 : 24" class="border-col">交货地点：{{ formState.deliveryPlace
        }}</a-col>
        <a-col :span="12" class="border-col">甲方（采购方）：{{ formState.purchaser }}</a-col>
        <a-col :span="12" class="border-col">乙方（供应方）：{{ formState.supplierName }}</a-col>
        <a-col :span="12" class="border-col">法定代表人：{{ formState.purchaserLegalPerson }}</a-col>
        <a-col :span="12" class="border-col">法定代表人：{{ formState.supplierLegalPerson }}</a-col>
        <a-col :span="12" class="border-col">联系人：{{ formState.purchaserContacts }}</a-col>
        <a-col :span="12" class="border-col">联系人：{{ formState.supplierContacts }}</a-col>
        <a-col :span="12" class="border-col">联系电话：{{ formState.purchaserContactNumber }}</a-col>
        <a-col :span="12" class="border-col">联系电话：{{ formState.supplierContactNumber }}</a-col>
        <a-col :span="12" class="border-col">电子邮箱：{{ formState.purchaserEmail }}</a-col>
        <a-col :span="12" class="border-col">电子邮箱：{{ formState.supplierEmail }}</a-col>
        <a-col :span="12" class="border-col">通讯地址：{{ formState.purchaserMailAddress }}</a-col>
        <a-col :span="12" class="border-col">通讯地址：{{ formState.supplierMailAddress }}</a-col>
      </a-row>
      <div class="dom-row-tip">
        鉴于甲方有意向乙方采购相应产品 ，且乙方有能力供应相应产品
        ，根据《中华人民共和国民法典 》和相关法律法规的规定 ，双方本着诚实守信
        、公平合理、互惠互利、共同发展的基础上
        ，就乙方向甲方供应产品达成如下共识，以兹共同遵守 。
      </div>
      <a-row class="border-row border-top">
        <a-col :span="24" class="border-col dom-row-title">付款信息</a-col>
        <a-col :span="12" class="border-col">结算方式：{{ formState.settleType }}</a-col>
        <a-col :span="12" class="border-col">账户名称：{{ formState.accountName }}</a-col>
        <a-col :span="12" class="border-col">开户行：{{ formState.openBank }}</a-col>
        <a-col :span="12" class="border-col">银行账号：{{ formState.bankCardNumber }}</a-col>
      </a-row>
      <div ref="table3">
        <a-row class="border-row border-top mg-t-1">
          <a-col :span="24" class="border-col dom-row-title">采购产品基本信息、要求及交货地址</a-col>
        </a-row>

        <a-row class="border-row" v-for="(item, index) in formState.list" :key="index">
          <template v-for="(citem, cindex) in item" :key="cindex">
            <a-col :span="widthList[cindex] || widthList['deafult']"
              class="border-col text-center flex align-center justify-center">{{ citem }}</a-col>
          </template>
        </a-row>

        <a-row class="border-row">
          <a-col :span="2" class="border-col text-center">合计数量</a-col>
          <a-col :span="3" class="border-col text-center">{{
            formState.totalCount
          }}</a-col>
          <a-col :span="3" class="border-col text-center">合计金额（大写）</a-col>
          <a-col :span="16" class="border-col flex justify-between">
            <span> {{ nFormat(formState.totalAmount, 4) }}</span>
            <span style="padding-right: 24px">
              （小写）：¥{{ nFormat(formState.totalAmount, 4) }}
            </span>
          </a-col>
          <a-col :span="24" class="border-col">
            <div class="pd-l-small">其他要求：{{ formState.other }}</div>
          </a-col>
        </a-row>
      </div>
      <div ref="contractTemplate">
        <a-row class="border-row border-top mg-t-1" v-if="formState.contractTemplate">
          <a-col :span="24" class="border-col dom-row-title">合同条款</a-col>
          <a-col :span="24" class="border-col">
            <showHtml :isView="true" :htmlContent="formState.contractTemplate"></showHtml>
          </a-col>
        </a-row>
      </div>
      <div class="dom-row-tip">
        本合同壹式贰份，双方各持壹份，具有同等法律效力，自甲乙双方盖章之日起生效。
      </div>
      <a-row class="dom-footer">
        <a-col :span="12">
          <div class="flex">
            <span> 甲方（盖章）： </span>
            <div class="flex-1" style="min-width: 0; word-break: break-all">
              {{ formState.purchaser }}
            </div>
          </div>
        </a-col>
        <a-col :span="12">
          <div class="flex">
            <span> 乙方（盖章）： </span>
            <div class="flex-1" style="min-width: 0; word-break: break-all">
              {{ formState.supplierName }}
            </div>
          </div>
        </a-col>
        <a-col :span="12">
          <div class="flex">
            <span> 法定代表人： </span>
            <div class="flex-1" style="min-width: 0; word-break: break-all">
              {{ formState.purchaserLegalPerson }}
            </div>
          </div>
        </a-col>
        <a-col :span="12">
          <div class="flex">
            <span> 法定代表人： </span>
            <div class="flex-1" style="min-width: 0; word-break: break-all">
              {{ formState.supplierLegalPerson }}
            </div>
          </div>
        </a-col>
        <a-col :span="12">
          <div class="flex">
            <span> 授权代表签字： </span>
            <div class="flex-1" style="min-width: 0; word-break: break-all"></div>
          </div>
        </a-col>
        <a-col :span="12">
          <div class="flex">
            <span> 授权代表签字： </span>
            <div class="flex-1" style="min-width: 0; word-break: break-all"></div>
          </div>
        </a-col>
        <a-col :span="12">
          <div class="flex">
            <span> 盖章日期： </span>
            <div class="flex-1" style="min-width: 0; word-break: break-all"></div>
          </div>
        </a-col>
        <a-col :span="12">
          <div class="flex">
            <span> 盖章日期： </span>
            <div class="flex-1" style="min-width: 0; word-break: break-all"></div>
          </div>
        </a-col>
      </a-row>
    </div>
  </div>
</template>
<script setup>
import { nFormat } from "@/utils/com.js";
import showHtml from "@/components/editors/showHtml.vue";
import { defineProps, watch, ref, reactive, defineExpose, nextTick } from "vue";
// import { getContractInfo } from "@/api/contract/manage";
const getContractInfo = () => {
  return {}
};
import { handlePdf, a4height } from "@/utils/htmlpdf.js";
import useUpload from "@/hook/useUpload";
const { uploadFile } = useUpload();
const formState = ref({});
const { pageHeightPx: PAGE_HEIGHT } = a4height({});
defineOptions({
  name: "pdfHtml",
});
const props = defineProps({
  id: {
    type: [String, Number],
  },
});
const widthList = {
  0: 1,
  deafult: 2,
};
const imgRef = ref(null);
const table3 = ref(null);
const contractTemplate = ref(null);
const pdf = ref(null);
const list = [
]
let loadImg = [];

const getinfo = () => {
  return new Promise((resolve, reject) => {
    getContractInfo(props.id).then((res) => {
      formState.value = res.data;
      nextTick(() => {
        const imgList = imgRef.value.getElementsByTagName("img");
        if (!imgList.length) return getPdf(resolve, reject);
        loadImg = [];
        for (let i = 0; i < imgList.length; i++) {
          if (!imgList[i].complete) {
            imgList[i].addEventListener(
              "load",
              imageLoaded(resolve, reject, imgList[i], imgList.length)
            );
          } else {
            imageLoaded(resolve, reject, imgList[i], imgList.length);
          }
        }
      });
    });
  });
};
// getinfo();
const imageLoaded = (resolve, reject, e, len) => {
  loadImg.push(e);
  if (loadImg.length != len) {
    return;
  }
  getPdf(resolve, reject);
};
const getPdf = (resolve, reject) => {
  const imgH = {};
  if (formState.value.contractTemplate) {
    handleContent(imgH);
  }

  let name = formState.value.supplierName + formState.value.contractNo;
  // return;

  handlePdf({ elementName: "dom-pdf", pdfname: name, imgH }).then(
    async (res) => {
      res.content = name;
      const uploaded = await uploadFile(res)
      resolve(uploaded.data)
    }
  );
};
const handleContent = (imgH) => {
  const refRect = imgRef.value.getBoundingClientRect();
  const htmlContent = contractTemplate.value;
  const htmlRect = htmlContent.getBoundingClientRect();
  let page = Math.ceil(htmlRect.top / PAGE_HEIGHT);
  let sH = 0;
  let pageH = PAGE_HEIGHT * page;
  const h = pageH - htmlRect.top;
  if (h < 40) {
    imgH[page] = PAGE_HEIGHT - h;
    sH += h;
    page += 1;
  }
  const htmlContentDom = htmlContent.querySelector("#htmlContent");
  const htmlContentRact = htmlContentDom.getBoundingClientRect();
  const h1 = PAGE_HEIGHT * page - htmlContentRact.top;
  if (h1 <= 0) return;
  let arr = Array.from(htmlContentDom.children);
  for (let index = 0; index < arr.length; index++) {
    const element = arr[index];
    const rect = element.getBoundingClientRect();
    sH += rect.height;
    const _rectTop = htmlContentRact.top + sH;
    if (_rectTop > pageH) {
      if (["TABLE"].includes(element.tagName)) {
        let mP = Math.ceil((_rectTop - pageH) / PAGE_HEIGHT);
        imgH[page] = PAGE_HEIGHT;
        page += mP;
        pageH = PAGE_HEIGHT * page;
        continue;
      }
      const s = handleRow(element, pageH - (_rectTop - rect.height));
      imgH[page] = PAGE_HEIGHT - s;
      sH += s;
      page += 1;
      pageH = PAGE_HEIGHT * page;
    }
  }
};
const handleRow = (element, cH) => {
  let textH = getTextHeight("测试", window.getComputedStyle(element));
  let ph = Math.floor(cH / textH) * textH;
  let s = cH - ph;
  return s;
};
const getTextHeight = (text, styles = {}) => {
  const hiddenDiv = document.createElement("div");

  // 设置样式以确保准确测量
  Object.assign(hiddenDiv.style, {
    position: "absolute",
    left: "-9999px",
    top: "-9999px",
    width: styles.width || "auto",
    whiteSpace: styles.whiteSpace || "normal",
    wordWrap: styles.wordWrap || "break-word",
    visibility: "hidden",
  });

  // 应用自定义样式
  if (styles.fontSize) hiddenDiv.style.fontSize = styles.fontSize;
  if (styles.fontFamily) hiddenDiv.style.fontFamily = styles.fontFamily;
  if (styles.lineHeight) hiddenDiv.style.lineHeight = styles.lineHeight;
  if (styles.padding) hiddenDiv.style.padding = styles.padding;
  if (styles.border) hiddenDiv.style.border = styles.border;

  hiddenDiv.textContent = text;

  document.body.appendChild(hiddenDiv);
  const height = hiddenDiv.offsetHeight;
  document.body.removeChild(hiddenDiv);

  return height;
};
const columns = [
  {
    title: "组件名称",
    dataIndex: "name",
    width: "200px",
    customRender: ({ record }) => {
      return record.name || "--";
    },
  },
  {
    title: "类别",
    dataIndex: "categoryName",
    width: "200px",
    customRender: ({ record }) => {
      return record.categoryName || "--";
    },
  },
  {
    title: "下单数量",
    dataIndex: "num",
    width: "200px",
    customRender: ({ record }) => {
      return record.num || "--";
    },
  },
  {
    title: "单价",
    dataIndex: "price",
    width: "200px",
    customRender: ({ record }) => {
      return record.price || "--";
    },
  },
  {
    title: "总价(含运含税)",
    dataIndex: "totalPrice",
    width: "200px",
    customRender: ({ record }) => {
      return record.totalPrice || "--";
    },
  },
  {
    title: "备注",
    dataIndex: "remark",
    width: "200px",
    customRender: ({ record }) => {
      return record.remark || "--";
    },
  },
];
defineExpose({
  getinfo,
});
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

  :deep(.dom-footer) {
    padding: 42px 0;
    font-size: 12px;

    .ant-col {
      padding: 8px 8px 8px 0;
      font-size: 12px;
    }
  }
}

.border-col {
  font-size: 12px;
  border-left: 1px solid #000;
  border-bottom: 1px solid #000;
  padding: 8px 4px;
  word-break: break-all;
}

.border-row {
  // border-top: 1px solid #000;
  border-right: 1px solid #000;
}

.border-top {
  border-top: 1px solid #000;
}

.table-footer {
  position: absolute;
  left: 0;
  width: 100%;
  top: 0;
  height: 54px;
  line-height: 54px;
  background: rgba(22, 119, 255, 0.05);
}

.pdf-hidden {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 1px;
  overflow: hidden;
}

.pdf-hidden1 {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: auto;
  background: #fff;
  z-index: 9999;
}
</style>
