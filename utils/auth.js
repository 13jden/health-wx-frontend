/**
 * 登录状态检查工具
 */

/**
 * 检查用户是否已登录
 * @returns {boolean} 是否已登录
 */
function checkLoginStatus() {
  const tokenUser = wx.getStorageSync('tokenUser');
  return tokenUser && tokenUser !== null;
}

/**
 * 页面登录拦截器
 * 在页面的onLoad或onShow中调用此函数
 * 如果用户未登录，会自动跳转到登录页
 * @param {Object} options 页面参数
 */
function requireLogin(options = {}) {
  if (!checkLoginStatus()) {
    wx.showToast({
      title: '请先登录',
      icon: 'none',
      duration: 1500
    });
    
    // 延迟跳转，让用户看到提示
    setTimeout(() => {
      wx.redirectTo({
        url: '/pages/login/login'
      });
    }, 1500);
    
    return false;
  }
  return true;
}

/**
 * 获取当前登录用户信息
 * @returns {Object|null} 用户信息
 */
function getCurrentUser() {
  return wx.getStorageSync('tokenUser');
}

/**
 * 清除登录信息
 */
function clearLoginInfo() {
  wx.removeStorageSync('tokenUser');
  wx.removeStorageSync('sessionid');
  wx.removeStorageSync('csrf_token');
  wx.removeStorageSync('userType');
  
  // 清除全局数据
  const app = getApp();
  if (app.globalData) {
    app.globalData.tokenUser = null;
    app.globalData.userInfo = null;
  }
}

module.exports = {
  checkLoginStatus,
  requireLogin,
  getCurrentUser,
  clearLoginInfo
};
