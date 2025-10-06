const { request } = require('../../utils/request.js');

Page({
  data: {
    name: "",
    username: "",
    password: "",
    confirmPassword: ""
  },

  // 获取输入值
  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },
  onUsernameInput(e) {
    this.setData({ username: e.detail.value });
  },
  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },
  onConfirmPasswordInput(e) {
    this.setData({ confirmPassword: e.detail.value });
  },

  // 提交注册
  async onRegisterSubmit() {
    const { name, username, password, confirmPassword } = this.data;

    if (!name || !username || !password || !confirmPassword) {
      wx.showToast({
        title: "请填写完整信息",
        icon: "none"
      });
      return;
    }

    if (password !== confirmPassword) {
      wx.showToast({
        title: "两次密码不一致",
        icon: "none"
      });
      return;
    }

    try {
      // 先设置一个临时的sessionid，这样request.js就不会重定向到登录页
      wx.setStorageSync("sessionid", "temp_session_for_register");
      
      const res = await request({
        url: '/wxapp/register/',
        method: 'POST',
        data: {
          name: this.data.name,
          username: this.data.username,
          password1: this.data.password,
          password2: this.data.confirmPassword
        }
      });

      if (res.data.code === 200) {
        wx.showToast({
          title: "注册成功",
          icon: "success"
        });
  
        setTimeout(() => {
          wx.redirectTo({
            url: "/pages/login/login"
          });
        }, 1000);
      } else {
        wx.showToast({
          title: res.data.message || "注册失败",
          icon: "error"
        });
      }
    } catch (error) {
      wx.showToast({
        title: "网络错误",
        icon: "none"
      });
    }
  },

  // 返回登录页
  onBackToLogin() {
    wx.navigateTo({
      url: "/pages/login/login"
    });
  }
});
