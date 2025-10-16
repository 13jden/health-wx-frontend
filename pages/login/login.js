const app = getApp(); // 获取全局变量
const { request } = require('../../utils/request.js');

Page({
  data: {
    openid: "",
    showRegisterForm: false,
    isRegistered: false
  },

  onLoad() {
    // 页面加载时自动尝试微信登录
    this.wxLogin();
  },

  /**
   * 微信登录
   */
  wxLogin() {
    wx.login({
      success: res => {
        if (res.code) {
          // 调用登录接口
          console.log("openid:",res.code);
          this.login(res.code);
        } else {
          console.error('获取 code 失败:', res.errMsg);
          wx.showToast({
            title: "微信登录失败",
            icon: "none"
          });
        }
      },
      fail: err => {
        console.error('微信登录失败:', err);
        wx.showToast({
          title: "微信登录失败",
          icon: "none"
        });
      }
    });
  },

  /**
   * 调用后端登录接口
   */
  async login(code) {
    try {
      const res = await request({
        url: '/api/auth/login',
        method: 'POST',
        data: {
          loginType: "WX", // 微信登录类型
          openCode: code // 直接传递微信的code
        }
      });

      if (res.data.code === 1) {
        // 登录成功，保存用户信息
        const tokenUser = res.data.data;
        app.globalData.tokenUser = tokenUser;
        wx.setStorageSync('tokenUser', tokenUser);
        
        this.setData({
          isRegistered: true
        });
        
        wx.showToast({
          title: "登录成功",
          icon: "success"
        });
        
        // 跳转到首页
        wx.switchTab({
          url: "/pages/index/index"
        });
      } else {
        // 登录失败，可能是未注册用户
        if (res.statusCode === 401 || res.statusCode === 400) {
          // 检查是否是用户不存在的错误
          if (res.data.message && res.data.message.includes("用户不存在")) {
            // 用户不存在，显示注册表单
            this.setData({
              openid: code, // 使用code作为openid
              showRegisterForm: true
            });
          } else {
            wx.showToast({
              title: res.data.message || "登录失败",
              icon: "error"
            });
          }
        } else {
          wx.showToast({
            title: res.data.message || "登录失败",
            icon: "error"
          });
        }
      }
    } catch (error) {
      console.error('登录失败:', error);
      if (error.statusCode === 401 || error.statusCode === 400) {
        // 检查是否是用户不存在的错误
        if (error.data && error.data.message && error.data.message.includes("用户不存在")) {
          // 未注册用户，显示注册表单
          this.setData({
            openid: code,
            showRegisterForm: true
          });
        } else {
          wx.showToast({
            title: error.data?.message || "登录失败",
            icon: "none"
          });
        }
      } else {
        wx.showToast({
          title: "网络错误",
          icon: "none"
        });
      }
    }
  },

  // 跳转到注册页面
  onRegister() {
    wx.navigateTo({
      url: `/pages/register/register?openid=${this.data.openid}`
    });
  }
});
