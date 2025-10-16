const app = getApp();
const { request } = require('../../utils/request.js');

Page({
  data: {
    username: "",
    phone: "",
    openid: ""
  },

  onLoad(options) {
    // 从登录页面传递过来的openid
    if (options.openid) {
      this.setData({
        code: options.openid
      });
    }
  },

  // 获取输入值
  onUsernameInput(e) {
    this.setData({ username: e.detail.value });
  },
  
  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  // 提交注册
  async onRegisterSubmit() {
    const { username, phone, openid } = this.data;

    if (!username || !phone) {
      wx.showToast({
        title: "请填写完整信息",
        icon: "none"
      });
      return;
    }

    // 简单的手机号格式验证
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      wx.showToast({
        title: "请输入正确的手机号",
        icon: "none"
      });
      return;
    }

    try {
      const res = await request({
        url: '/api/user/register',
        method: 'POST',
        data: {
          username: this.data.username,
          phone: this.data.phone,
          openId: this.data.openid
        }
      });

      if (res.data.success) {
        wx.showToast({
          title: "注册成功",
          icon: "success"
        });

        // 注册成功后自动登录
        setTimeout(async () => {
          await this.autoLogin();
        }, 1000);
      } else {
        wx.showToast({
          title: res.data.message || "注册失败",
          icon: "error"
        });
      }
    } catch (error) {
      console.error('注册失败:', error);
      wx.showToast({
        title: "网络错误",
        icon: "none"
      });
    }
  },

  // 自动登录
  async autoLogin() {
    try {
      const res = await request({
        url: '/api/auth/login',
        method: 'POST',
        data: {
          loginType: "WX",
          openCode: this.data.openid
        }
      });

      if (res.data.success) {
        // 登录成功，保存用户信息
        const tokenUser = res.data.data;
        app.globalData.tokenUser = tokenUser;
        wx.setStorageSync('tokenUser', tokenUser);
        
        wx.showToast({
          title: "登录成功",
          icon: "success"
        });
        
        // 跳转到首页
        wx.switchTab({
          url: "/pages/index/index"
        });
      } else {
        wx.showToast({
          title: "自动登录失败，请重新登录",
          icon: "error"
        });
        wx.navigateBack();
      }
    } catch (error) {
      console.error('自动登录失败:', error);
      wx.showToast({
        title: "自动登录失败，请重新登录",
        icon: "error"
      });
      wx.navigateBack();
    }
  },

  // 返回登录页
  onBackToLogin() {
    wx.navigateBack();
  }
});
