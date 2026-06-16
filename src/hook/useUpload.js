import { formatDateTime, getSidUuid } from "@/utils/com.js";
import { ref } from "vue";
import { getToken } from "@/api/qiNiu.js";
import { message } from "ant-design-vue";
import { fileNames } from "@/utils/preview.js";
import * as qiniu from "qiniu-js";
let fileTypelist = {
  ".jpg": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"],
  ".pdf": [".pdf"],
  ".zip": [".zip", ".rar", ".7z", ".tar", ".gz", ".bz2", ".xz"],
  ".xlsx": [".xlsx", ".xls", ".xlsb", ".xlsm", ".xlst", ".csv"],
  ".doc": [".doc", ".docx"],
  ".txt": [".txt"],
};
export default function useUpload() {
  // const setp = ref(null);
  const uploadFile = function (file, fn, opts = {}) {
    // maxSize：单位 MB，0 或不传表示不限制
    const { types = "", maxSize = 0 } = opts || {};
    const extension = file.name.split(".").pop().toLowerCase();
    if (types) {
      let _type = types.split(",");
      _type = _type.map((item) => fileTypelist[item.trim()]).flat(1);
      if (!_type.includes("." + extension)) {
        // fn && fn(res)
        message.warning("文件格式不正确");
        return Promise.reject();
      }
    }
    const maxMb = Number(maxSize) || 0;
    if (maxMb > 0 && file.size > maxMb * 1024 * 1024) {
      message.warning(`文件大小不能超过 ${maxMb}MB`);
      return Promise.reject();
    }
    let that = this;
    return new Promise((resolve, reject) => {
      getToken()
        .then((result) => {
          const pos = file.name.lastIndexOf(".");
          let lastName = file.name.substring(0, pos);
          lastName = lastName.replace(/[\(\)\s]/g, "");
          const name = {
            name: "media/image/",
            time: formatDateTime(new Date().getTime(), "yyyy-MM-dd/"),
            random: getSidUuid(),
            text: "_name:" + lastName,
            type: file.name.substr(file.name.lastIndexOf(".")),
          };
          const observable = qiniu.upload(
            file,
            Object.values(name).join(""),
            result.data.token,
          );

          observable.subscribe({
            next: (res) => {
              fn && fn(res);
              // setp.value = res
            },
            error(err) {
              console.log(err);
              reject(err);
            },
            complete: (res) => {
              const sizeMb = Number((file.size / (1024 * 1024)).toFixed(2));
              let obj = {
                data: "/" + res.key,
                name: file.name,
                size: sizeMb,
                type: file.type,
                file: file,
              };
              resolve(obj);
            },
          });
        })
        .catch((err) => {
          console.log(err);
          reject(err);
        });
    });
  };
  const fileType = (file) => {
    if (!file) return false;
    let fileName = file;
    let pos = fileName.lastIndexOf(".");
    if (pos > 0) {
      let lastName = fileName.substring(pos, fileName.length);
      return lastName;
    } else {
      return false;
    }
  };
  return { uploadFile, fileType, fileNames };
}
