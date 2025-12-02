const app = getApp();
const { requireLogin, clearLoginInfo, getCurrentUser } = require('../../utils/auth.js');
const { requestSubscribeMessage } = require('../../utils/subscribeMessage.js');

Page({
  data: {
    userInfo: {
      username: "",
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
    // 检查登录状态
    if (!requireLogin()) {
      return;
    }
    this.loadUserInfo();
  },
  onLoad() {
    // 检查登录状态
    if (!requireLogin()) {
      return;
    }
    this.loadUserInfo();
  },

  // 加载用户信息
  loadUserInfo() {
    const tokenUser = getCurrentUser();
    const userType = wx.getStorageSync("userType");
    let userTypeStr;
    
    // 根据role显示不同的身份
    if (userType === "USER") {
      userTypeStr = "家长";
    } else if (userType === "DOCTOR") {
      userTypeStr = "医生";
    } else if (userType === "ADMIN") {
      userTypeStr = "管理员";
    } else {
      userTypeStr = "用户";
    }
    
    this.setData({
      userInfo: {
        username: tokenUser.username || "",
        avatar: tokenUser.avatar || "/assets/avatar/default-avatar.png"
      },
      userType: userTypeStr
    });
    
    app.globalData.userInfo = tokenUser;
  },

  // 退出登录
  onLogout() {
    // 使用统一的清除登录信息函数
    clearLoginInfo();
    
    wx.showToast({
      title: '已退出登录',
      icon: 'success',
      duration: 1500
    });
    
    // 延迟跳转，让用户看到提示
    setTimeout(() => {
      wx.redirectTo({
        url: "/pages/login/login"
      });
    }, 1500);
  },

  // 取消订阅消息
  async onCancelSubscribe() {
    wx.showModal({
      title: '取消订阅',
      content: '确定要取消所有消息订阅吗？取消后您将不再收到打卡提醒和健康报告通知。',
      confirmText: '确定取消',
      cancelText: '暂不取消',
      success: async (res) => {
        if (res.confirm) {
          try {
            // 清除总是允许的设置
            wx.removeStorageSync('subscribeAlwaysAllow');
            wx.removeStorageSync('subscribeModalShown');
            
            // 尝试取消订阅（微信小程序无法直接取消，只能通过设置页面）
            wx.showModal({
              title: '提示',
              content: '请在微信设置中关闭小程序的消息通知权限',
              showCancel: false,
              confirmText: '知道了'
            });
            
            wx.showToast({
              title: '已清除订阅设置',
              icon: 'success',
              duration: 2000
            });
          } catch (error) {
            console.error('取消订阅失败:', error);
            wx.showToast({
              title: '操作失败',
              icon: 'none'
            });
          }
        }
      }
    });
  }
});
