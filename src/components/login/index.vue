<template>
  <div class="login-class">
    <div class="flex cg-login-main">
      <div class="log-left flex-1">
        <img
          src="@/assets/login_text.png"
          style="max-width: 592px; height: 267px"
          alt="logo"
        />
      </div>
      <div class="log-right flex justify-end">
        <div class="cg-login-card">
          <a-form
            :model="formState"
            @finish="onFinish"
            @finishFailed="onFinishFailed"
          >
            <div class="cg-login-title">欢迎登录</div>
            <div class="cg-login-sub">请使用手机号与密码登录</div>
            <a-form-item
              name="username"
              :rules="[
                {
                  required: true,
                  validator: validatorPhone,
                  messages: '请输入手机号',
                },
              ]"
              label=""
            >
              <a-input
                placeholder="请输入手机号"
                style="height: 48px"
                v-model:value="formState.username"
                autocomplete="username"
                aria-label="手机号"
              />
            </a-form-item>

            <a-form-item
              label=""
              name="password"
              :rules="[{ required: true, message: '请输入密码' }]"
            >
              <a-input-password
                style="height: 48px"
                placeholder="请输入密码"
                v-model:value="formState.password"
                autocomplete="current-password"
                aria-label="密码"
              />
            </a-form-item>

            <a-form-item label="">
              <a-button type="primary" html-type="submit">登录</a-button>
            </a-form-item>
          </a-form>
        </div>
      </div>
    </div>
  </div>
  <Main-part
    @change="change"
    v-model:visible="visible"
    :list="list"
  ></Main-part>
</template>
<script setup>
import MainPart from "./mainPart.vue";
import { validatorPhone } from "@/utils/validator";
import { reactive, ref } from "vue";
import { toLogin, confirmAuth } from "@/api/login";
import { message } from "ant-design-vue";
import { useRouter } from "vue-router";
import userStore from "@/store/user";

let pdmToken = "";
const router = useRouter();
const user = userStore();
const visible = ref(false);
const list = ref([]);
user.routeChangeState = false;
const formState = reactive({
  username: "",
  password: "",
  remember: true,
  value: "86",
});
const onFinish = async (values) => {
  const res = await toLogin({
    mobile: values.username,
    password: values.password,
  });
  if (res.errno === 0) {
    pdmToken = res.data.pdmToken;
    const clientInfo = res.data?.clientInfo ?? [];
    if (clientInfo.length === 1) {
      await change(clientInfo[0]);
      return;
    }
    if (clientInfo.length) {
      list.value = clientInfo;
    }
    visible.value = true;
  }
};
const onFinishFailed = () => {
  // 校验失败时表单项会展示错误信息，此处无需额外提示
};
const change = async (row) => {
  const res = await confirmAuth({ pdmToken, clientId: row.clientId });
  if (res.errno === 0) {
    window.name = res.data.userInfo.userId;
    user.setToken(res.data.token, true);
    message.success("登录成功");
    try {
      let rq = router.currentRoute.value.query.rq;
      if (rq) {
        window.location.replace(window.atob(rq));
      } else {
        router.push("/");
      }
    } catch (error) {
      router.push("/");
    }
  }
};
</script>
<style lang="scss" scoped>
.login-class {
  width: 100vw;
  height: 100vh;
  min-width: 1300px;
  overflow: auto;
  padding: 13.5vh 9vw 14.5vh 12.5vw;
  background-size: cover;
  background-position: center;
  background-image: url("@/assets/login-bg.png");
  @media screen and (max-width: 1500px) {
    padding: 13.5vh 5vw 14.5vh 9vw;
  }
  @media screen and (max-width: 1400px) {
    padding: 13.5vh 5vw 14.5vh 9vw;
  }
  .log-left {
    margin-right: 16vw;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 592px;
    height: 620px;
    img {
      width: 592px;
      height: 267px;
    }
    @media screen and (max-width: 1500px) {
      transform: scale(0.85);
      margin-right: 12vw;
    }
    @media screen and (max-width: 1400px) {
      transform: scale(0.8);
      margin-right: 15vw;
    }
  }

  .log-right {
    .cg-login-card {
      width: 504px;
      min-width: min(375px, 100%);
      height: 100%;
      background: #ffffff;
      box-sizing: border-box;
      border-radius: 12px;
      box-shadow: 0 12px 40px rgba(15, 36, 84, 0.12);
      overflow: hidden;
      font-family:
        PingFangSC,
        PingFang SC;
      font-style: normal;
      @media screen and (max-width: 1500px) {
        width: 404px;
        height: 600px;
      }
      @media screen and (max-width: 1400px) {
        width: 404px;
        height: 570px;
      }
    }

    .cg-login-title {
      font-weight: 500;
      font-size: 40px;
      color: #1d252f;
      line-height: 56px;
    }

    .cg-login-sub {
      line-height: 25px;
      font-weight: 400;
      font-size: 18px;
      color: #1d252f;
      margin: 10px 0 60px;
    }

    :deep(.ant-form) {
      padding: 60px;
      height: 600px;
      input:-internal-autofill-previewed,
      input:-internal-autofill-selected {
        transition: background-color 5000s ease-in-out 0s !important;
      }
      .ant-input-group {
        display: flex;
        height: 48px;

        .ant-select {
          width: 80px;
          position: relative;

          .ant-select-arrow {
            color: #4e5969;
            font-size: 10px;
          }

          &::after {
            content: "";
            position: absolute;
            z-index: 1;
            top: 0;
            right: 0;
            width: 1px;
            height: 100%;
            background: #e5e8ef;
          }
        }

        .ant-select-selector {
          height: 100%;
          background: #f2f3f8;
          border: none;
          border-radius: 1px;
          font-family:
            PingFangSC,
            PingFang SC;
          font-weight: 400;
          font-size: 14px;
          color: #1d252f;

          .ant-select-selection-item {
            line-height: 46px;
          }
        }
      }

      .ant-input {
        background: #f2f3f8;
        border-radius: 1px;
        font-family:
          PingFangSC,
          PingFang SC;
        font-weight: 400;
        font-size: 14px;
        color: #1d252f;
        border: none;
        flex: 1;
        min-width: 0;
      }

      .ant-input-password {
        background: #f2f3f8;
        border: none;
      }

      .ant-btn {
        height: 48px;
        width: 100%;
        border-radius: 4px;
        font-weight: 500;
        font-size: 16px;
      }
    }
  }
}
</style>
