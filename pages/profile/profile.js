const app = getApp();
const { request } = require('../../utils/request.js');

Page({
  data: {
    userInfo: {
      first_name: "",
      last_name: "",
      avatar: "/assets/avatar/default-avatar.png"
    },
    userType : "",
    menuItems: [
      { text: "我的宝宝", icon: "/assets/icons/baby.png" },
      { text: "帮助指南", icon: "/assets/icons/help.png" },
      { text: "推荐给朋友", icon: "/assets/icons/share.png" },
      { text: "儿童养育科学公众号", icon: "/assets/icons/wechat.png" },
      { text: "育儿交流群", icon: "/assets/icons/group.png" },
      { text: "关联小程序到您的公众号", icon: "/assets/icons/link.png" },
      { text: "关于", icon: "/assets/icons/info.png" }
    ]
  },
  onShow() {
    this.getUserProfile();
  },
  onLoad() {
    this.getUserProfile();
  },

  // 获取用户信息
  async getUserProfile() {
    try {
      const res = await request({
        url: '/wxapp/user/profile/',
        method: 'GET'
      });

      if (res.data.code === 200) {
        const userType = wx.getStorageSync("userType")
        let userTypeStr
        if ( userType == "parent"){
           userTypeStr="家长";
        } else {
           userTypeStr="医生";
        }
        if (res.data.data.avatar && res.data.data.avatar.startsWith("/media/avatar/")){
          res.data.data.avatar = app.globalData.baseURL+ res.data.data.avatar
        }
        this.setData({
          userInfo: res.data.data,
          userType: userTypeStr
        });
        app.globalData.userInfo = res.data.data
        
      } else {
        wx.showToast({
          title: "获取信息失败",
          icon: "error"
        });
        wx.navigateTo({
          url:  "/pages/login/login"  // 需要加  /
        })
      }
    } catch (error) {
      wx.showToast({
        title: "网络错误",
        icon: "none"
      });
    }
  },

  // 退出登录
  async onLogout() {
    try {
      await request({
        url: '/wxapp/user/logout/',
        method: 'POST'
      });
      
      wx.removeStorage("sessionid");
      wx.removeStorage("csrf_token");
      wx.removeStorage("userType");

      wx.redirectTo({
        url: "/pages/login/login"
      });
    } catch (error) {
      // 即使网络请求失败，也要清除本地存储并跳转到登录页
      wx.removeStorage("sessionid");
      wx.removeStorage("csrf_token");
      wx.removeStorage("userType");

      wx.redirectTo({
        url: "/pages/login/login"
      });
    }
  }
});
