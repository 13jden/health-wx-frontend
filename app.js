// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

  },
  globalData: {
    userInfo: null,
    tokenUser: null, // 存储登录后的用户信息
    nowChildId: null,
    children: [],
    userType: "parent",
    // baseURL: "http://127.0.0.1:8000/",
    apiBase: 'http://115.190.53.97:8081/',
    baseURL: 'http://115.190.53.97:8081/'
    // apiBase: 'http://localhost:8081/'
  }
})
