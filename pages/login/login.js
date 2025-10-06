const app = getApp(); // 获取全局变量
const { request } = require('../../utils/request.js');

Page({
  data: {
    username: "",
    password: ""
  },

  // 获取输入的用户名
  onUsernameInput(e) {
    this.setData({
      username: e.detail.value
    });
  },

  // 获取输入的密码
  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    });
  },

  // 处理家长登录
  onLoginParent() {
    this.login("parent");
  },

  // 处理医师登录
  onLoginDoctor() {
    this.login("doctor");
  },

  // 处理登录逻辑
  async login(userType) {
    try {
      // 先设置一个临时的sessionid，这样request.js就不会重定向到登录页
      wx.setStorageSync("sessionid", "temp_session_for_login");
      
      const res = await request({
        url: '/wxapp/login/',
        method: 'POST',
        data: {
          username: this.data.username,
          password: this.data.password,
          user_type: userType
        }
      });

      if (res.data.code === 200) {
        wx.setStorageSync("sessionid", res.data.sessionid);  // 存储 Session ID
        wx.setStorageSync("csrf_token", res.data.csrf_token);
        wx.removeStorage('userType')
        wx.setStorageSync('userType', userType);
        app.globalData.userType = userType;
        wx.showToast({
          title: "登录成功",
          icon: "success"
        });
        console.log("登录信息", res.data)  
        console.log("userType", userType)  
        // 跳转到对应的页
        wx.switchTab({
          url: "/pages/profile/profile"  // 需要加  /
        })
        console.log("// 跳转到对应的页")
      } else {
        wx.showToast({
          title: res.data.message,
          icon: "error"
        });
      }
    } catch (error) {
      wx.showToast({
        title: "网络错误",
        icon: "none"
      });
    }
  },

  // 跳转到注册页面
  onRegister() {
    wx.navigateTo({
      url: "/pages/register/register"
    });
  }
});
