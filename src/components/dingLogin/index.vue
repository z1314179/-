<template>
  <div class="loader"></div>
  <!-- <div style="height: 100vh; color: #000">{{ test }}11111</div> -->
</template>

<script setup>
import * as dingtalk from "dingtalk-jsapi";
import useStore from "@/store/user.js";
import { ddLogin } from "@/api/login";
import { useRouter } from "vue-router";
const corpId = process.env.corpId;
const router = useRouter();
const user = useStore();
import { ref, reactive } from "vue";
const test = reactive({});

toDd();
function toDd() {
  if (window.navigator.userAgent.includes("DingTalk")) {
    dingtalk.ready(function () {
      dingtalk.runtime.permission.requestAuthCode({
        corpId: corpId,
        onSuccess: function (result) {
          ddlogin(result.code);
        },
        onFail: function (err) {
          test.err1 = err;
          user.toLogin();
        },
        onAuthFailed: function (err) {
          test.err2 = err;
          user.toLogin();
        },
      });
    });
  } else {
    user.toLogin();
  }
}

async function ddlogin(code) {
  try {
    test.code = code;
    const res = await ddLogin({ codeNo: code });
    toHome(res);
  } catch (error) {
    test.error = error;
    user.toLogin();
  }
}
function toHome(res) {
  if (res.errno !== 0) {
    test.value = JSON.stringify(res);
    user.toLogin();
    return;
  }
  user.setToken(res.data.token);
  test.rq = router.currentRoute.value.query.rq;
  if (router.currentRoute.value.query.rq) {
    window.location.replace(window.atob(router.currentRoute.value.query.rq));
  } else {
    // router.replace({ patt: "/", query: new Date().getTime() });
    window.location.replace(window.location.origin);
  }
}
function toPage() {}
</script>

<style>
/* HTML: <div class="loader"></div> */
.loader {
  margin: 20vh auto;
  --s: 25px;
  --g: 5px;

  width: calc(3 * (1.353 * var(--s) + var(--g)));
  display: grid;
  justify-items: end;
  aspect-ratio: 3;
  overflow: hidden;
  --_m: linear-gradient(90deg, #0000, #000 15px calc(100% - 15px), #0000);
  -webkit-mask: var(--_m);
  mask: var(--_m);
}
.loader:before {
  content: "";
  width: 200%;
  background: linear-gradient(90deg, #ff1818 50%, #0000 0),
    conic-gradient(
      from -90deg at var(--s) calc(0.353 * var(--s)),
      #fff 135deg,
      #666 0 270deg,
      #aaa 0
    );
  background-blend-mode: multiply;
  --_m: linear-gradient(
      to bottom right,
      #0000 calc(0.25 * var(--s)),
      #000 0 calc(100% - calc(0.25 * var(--s)) - 1.414 * var(--g)),
      #0000 0
    ),
    conic-gradient(
      from -90deg at right var(--g) bottom var(--g),
      #000 90deg,
      #0000 0
    );
  -webkit-mask: var(--_m);
  mask: var(--_m);
  background-size: calc(100% / 3) 100%, calc(100% / 6) 100%;
  -webkit-mask-size: calc(100% / 6) 100%;
  mask-size: calc(100% / 6) 100%;
  -webkit-mask-composite: source-in;
  mask-composite: intersect;
  animation: l10 1s infinite linear;
}
@keyframes l10 {
  to {
    transform: translate(calc(100% / 3));
  }
}
</style>
