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
    nowChildId:null,
    children:[],
    userType:"doctor",
    baseURL: "http://127.0.0.1:8000/",
    apiBase: 'http://127.0.0.1:8000/' // 替换为你的电脑IP
  }
})
