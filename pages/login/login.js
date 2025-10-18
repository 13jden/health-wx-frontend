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
    console.log("开始登录，code:", code);
    try {
      const res = await request({
        url: '/api/auth/login',
        method: 'POST',
        data: {
          loginType: "WX",
          openCode: code
        }
      });

      console.log("登录响应:", res);
      
      // 检查状态码
      if (res.statusCode === 400) {
        // 400状态码表示用户不存在，显示注册表单
        console.log("用户不存在，显示注册表单");
        this.setData({
          openid: code,
          showRegisterForm: true
        });
        return;
      }
      
      if (res.statusCode === 200 && res.data && res.data.code === 1) {
        // 登录成功，保存用户信息
        const tokenUser = res.data.data;
        app.globalData.tokenUser = tokenUser;
        wx.setStorageSync('tokenUser', tokenUser);
        
        // 保存用户类型到全局数据和本地存储
        const userType = tokenUser.role || 'USER';
        app.globalData.userType = userType;
        wx.setStorageSync('userType', userType);
        
        console.log('登录成功，准备跳转，userType:', userType);
        
        // 根据用户角色跳转到不同页面（不显示toast，直接跳转）
        if (tokenUser.role === 'DOCTOR') {
          // 医生跳转到profile页面
          wx.reLaunch({
            url: "/pages/profile/profile"
          });
        } else {
          // 普通用户和管理员跳转到首页
          wx.reLaunch({
            url: "/pages/index/index"
          });
        }
      } else {
        // 其他错误
        wx.showToast({
          title: res.data?.message || "登录失败",
          icon: "error"
        });
      }
    } catch (error) {
      console.error('登录失败:', error);
      wx.showToast({
        title: "网络错误",
        icon: "none"
      });
    }
  },

  // 跳转到注册页面
  onRegister() {
    wx.navigateTo({
      url: `/pages/register/register`
    });
  }
});
