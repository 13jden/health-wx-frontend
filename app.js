// app.js
const { checkLoginStatus, getCurrentUser } = require('./utils/auth.js');

App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 初始化时检查登录状态
    this.initLoginStatus();
  },

  // 初始化登录状态
  initLoginStatus() {
    if (checkLoginStatus()) {
      // 如果已登录，恢复全局数据
      const tokenUser = getCurrentUser();
      if (tokenUser) {
        this.globalData.tokenUser = tokenUser;
      }
    }
  },

  globalData: {
    userInfo: null,
    tokenUser: null, // 存储登录后的用户信息
    nowChildId: null,
    children: [],
    userType: "parent",
    baseURL: "http://127.0.0.1:8000/",
    apiBase: 'http://localhost:8081/'
    // apiBase: 'http://115.190.53.97:8081/',
    // baseURL: 'http://115.190.53.97:8081/'
    
  }
})
