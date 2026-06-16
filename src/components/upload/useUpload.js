import { formatDateTime, getSidUuid } from "@/utils/com.js";
import { ref } from "vue";
import { getToken } from "@/api/qiNiu.js";
import * as qiniu from "qiniu-js";
export default function useUpload() {
  
  const setp = ref(null);
  const uploadFile = function (file) {
    return new Promise((resolve, reject) => {
      getToken()
        .then((result) => {
          const pos = file.name.lastIndexOf(".");
          const lastName = file.name.substring(0, pos);
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
            result.data.token
          );

          observable.subscribe({
            next: (res) => {
              setp.value = res
            },
            error(err) {
              console.log(err);
              reject(err)
            },
            complete: (res) => {
              resolve("/" + res.key)
            },
          });
        })
        .catch((err) => {
          console.log(err);
          reject(err)
        });
    })

  };

  return { uploadFile, setp }
}