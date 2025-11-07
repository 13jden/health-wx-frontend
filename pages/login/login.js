const app = getApp(); // 获取全局变量
const { request } = require('../../utils/request.js');
const { subscribeCheckInMessage, showSubscribeGuide, handleSubscribeResult } = require('../../utils/subscribeMessage.js');

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
        
        // 登录成功后，先尝试订阅打卡消息
        this.handleSubscribeMessage();
        
        // 根据用户角色跳转到不同页面（不显示toast，直接跳转）
        if (tokenUser.role === 'DOCTOR') {
          // 医生跳转到profile页面
          wx.reLaunch({
            url: "/pages/profile/profile"
          });
        } else {
          // 普通用户和管理员跳转到首页
          // 使用setTimeout确保数据完全保存后再跳转
          setTimeout(() => {
            wx.reLaunch({
              url: "/pages/index/index"
            });
          }, 100);
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
  },

  /**
   * 处理订阅消息
   */
  handleSubscribeMessage() {
    console.log('开始处理订阅消息');
    
    // 检查是否支持订阅消息
    if (!wx.canIUse('requestSubscribeMessage')) {
      console.log('当前基础库版本不支持订阅消息，跳过处理');
      return;
    }
    
    // 延迟一点时间，确保页面跳转不会受到影响
    setTimeout(() => {
      this.showSubscribeGuide();
    }, 200);
  },

  /**
   * 显示订阅消息引导
   */
  showSubscribeGuide() {
    // 先检查是否支持订阅消息
    if (!wx.canIUse('requestSubscribeMessage')) {
      console.log('当前基础库版本不支持订阅消息，跳过引导');
      return;
    }
    
    showSubscribeGuide({
      title: '开启打卡提醒',
      content: '为了及时提醒您进行健康打卡，建议开启消息订阅',
      confirmText: '立即开启',
      cancelText: '暂不开启',
      onConfirm: () => {
        this.requestSubscribeMessage();
      },
      onCancel: () => {
        console.log('用户选择暂不开启订阅消息');
      }
    });
  },

  /**
   * 请求订阅消息
   */
  async requestSubscribeMessage() {
    try {
      console.log('开始请求订阅消息');
      const result = await subscribeCheckInMessage();
      
      const CHECK_IN_TEMPLATE_ID = '4OFcdPl680DgcRzmHDs2Jh-DQCyYlkZ2vRfXZ3-ENCk';
      const handleResult = handleSubscribeResult(result, CHECK_IN_TEMPLATE_ID);
      
      console.log('订阅消息结果:', handleResult);
      
      if (handleResult.success) {
        wx.showToast({
          title: '订阅成功',
          icon: 'success',
          duration: 2000
        });
      } else {
        console.log('订阅失败:', handleResult.message);
        // 不显示错误提示，避免影响用户体验
      }
      
    } catch (error) {
      console.error('订阅消息失败:', error);
      
      // 根据错误类型给出不同提示
      if (error.errCode === 20004) {
        console.log('用户关闭了主开关，无法进行订阅');
      } else if (error.errCode === 20005) {
        console.log('小程序被禁封');
      } else if (error.errCode === -1) {
        console.log('当前基础库版本不支持订阅消息');
      } else {
        console.log('订阅消息请求失败:', error.errMsg);
      }
    }
  }
});
