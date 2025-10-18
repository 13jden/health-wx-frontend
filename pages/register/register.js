const app = getApp();
const { request } = require('../../utils/request.js');

Page({
  data: {
    username: "",
    phone: "",
    code: ""
  },

  onLoad() {
    // 重新获取微信登录code
    this.getWxCode();
  },

  /**
   * 获取微信登录code
   */
  getWxCode() {
    wx.login({
      success: res => {
        if (res.code) {
          this.setData({
            code: res.code
          });
          console.log("获取到新的code:", res.code);
        } else {
          console.error('获取 code 失败:', res.errMsg);
          wx.showToast({
            title: "获取登录信息失败",
            icon: "none"
          });
        }
      },
      fail: err => {
        console.error('微信登录失败:', err);
        wx.showToast({
          title: "获取登录信息失败",
          icon: "none"
        });
      }
    });
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
    const { username, phone, code } = this.data;

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
          username: username,
          phone: phone,
          code
        }
      });

      if (res.statusCode === 200 && res.data && res.data.success) {
        wx.showToast({
          title: "注册成功",
          icon: "success"
        });

        // 注册成功后跳转到登录页面
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        wx.showToast({
          title: res.data?.message || "注册失败",
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

  // 返回登录页
  onBackToLogin() {
    wx.navigateBack();
  }
});
