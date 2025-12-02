const app = getApp();
const { requireLogin, getCurrentUserDetail } = require('../../utils/auth.js');
const { subscribeAllMessages } = require('../../utils/subscribeMessage.js');

Page({
  data: {
    userType: "parent", // 默认是家长端
    children: [], // 儿童列表
    currentChildId: null, // 当前选中的儿童ID
    swiperList: [
      { imgUrl: "/assets/icons/ind1.jpg"},
      { imgUrl: "/assets/icons/ind2.jpg"},
      { imgUrl: "/assets/icons/ind1.jpg"}
    ],
    isPageReady: false, // 页面是否准备好
    showSubscribeModal: false, // 是否显示订阅弹窗
    checkInEnabled: false, // 打卡提醒开关状态
    alwaysAllow: false // 总是保持以上选择
  },
 // 轮播图点击事件
 onSwiperTap(e) {
  const url = e.currentTarget.dataset.url;
  if (url) {
    wx.navigateTo({ url });
  }
},
  onLoad() {
    console.log('index页面onLoad开始');
    // 检查登录状态
    if (!requireLogin()) {
      console.log('未登录，跳转到登录页');
      return;
    }
    console.log('已登录，开始初始化页面');
    
    // 延迟初始化，确保全局数据已设置
    setTimeout(() => {
      // 获取全局的 userType，这里模拟从后台获取
      this.setUserType();
      this.getChildrenList();
      
      // 检查是否需要显示订阅弹窗（仅在登录成功后首次进入时）
      this.checkAndShowSubscribeModal();
      
      // 添加调试信息
      console.log('页面数据初始化完成:', {
        userType: this.data.userType,
        children: this.data.children,
        swiperList: this.data.swiperList
      });
    }, 50);
  },

  onShow() {
    console.log('index页面onShow开始');
    // 检查登录状态
    if (!requireLogin()) {
      console.log('onShow: 未登录，跳转到登录页');
      return;
    }
    console.log('onShow: 已登录，更新页面数据');
    // 每次显示时，检查并更新 userType
    this.setUserType();
    // 每次显示时重新获取数据，确保数据是最新的
    this.getChildrenList();
  },
  calculateAge(birth_time) {
    if (!birth_time) {
      return 0;
    }
    try {
      const birthDate = new Date(birth_time);
      const currentDate = new Date();
      return currentDate.getFullYear() - birthDate.getFullYear();
    } catch (error) {
      console.error('计算年龄失败:', error, 'birth_time:', birth_time);
      return 0;
    }
  },
  async getChildrenList() {
    console.log('开始获取儿童列表');
    try {
      const storageChildren = wx.getStorageSync('children');
      const storageCurrentId = wx.getStorageSync('currentChildId');
      if (storageChildren && storageChildren.length > 0) {
        console.log('优先使用storage中的儿童信息');
        this.setData({
          children: storageChildren,
          currentChildId: storageCurrentId || storageChildren[0].id,
          isPageReady: true
        });
        app.globalData.children = storageChildren;
        app.globalData.nowChildId = storageCurrentId || storageChildren[0].id;
        return;
      }

      // 首先获取当前用户信息
      const userDetail = await getCurrentUserDetail();
      console.log('获取到的用户信息:', userDetail);
      
      // 引入封装的儿童API
      const childApi = require("../../api/child");
      
      if (!userDetail || !userDetail.id) {
        console.error('无法获取用户信息，尝试使用旧接口');
        // 如果无法获取用户ID，回退到旧接口
        const res = await childApi.getAllChildren();
        console.log('回退API响应:', res);
        if (res.statusCode === 200 && res.data) {
          console.log('回退API响应结构:', res.data);
          
          // 检查响应结构，可能数据在 res.data.data 中
          let childrenData = res.data;
          if (res.data.data && Array.isArray(res.data.data)) {
            childrenData = res.data.data;
            console.log('回退使用嵌套的data字段:', childrenData);
          } else if (Array.isArray(res.data)) {
            childrenData = res.data;
            console.log('回退直接使用data字段:', childrenData);
          }
          
          if (Array.isArray(childrenData)) {
            const children = childrenData.map(child => {
              if (!child || typeof child !== 'object') {
                console.warn('无效的儿童数据:', child);
                return null;
              }
              return {
                ...child,
                age: this.calculateAge(child.birth_time)
              };
            }).filter(child => child !== null);
            
          // 更新全局数据
          app.globalData.children = children;
          
          // 存储到storage
          let currentChildId = null;
          if (children.length > 0) {
            wx.setStorageSync('children', children);
            
            // 检查是否已有选中的孩子，如果没有则选择第一个
            const existingCurrentChildId = wx.getStorageSync('currentChildId');
            if (!existingCurrentChildId || !children.find(child => child.id === existingCurrentChildId)) {
              currentChildId = children[0].id;
              wx.setStorageSync('currentChildId', currentChildId);
              app.globalData.nowChildId = currentChildId;
              console.log('设置默认选中孩子:', currentChildId);
            } else {
              // 保持当前选中的孩子
              currentChildId = existingCurrentChildId;
              app.globalData.nowChildId = currentChildId;
              console.log('保持当前选中孩子:', currentChildId);
            }
          }
          
          // 更新页面数据并标记页面准备完成
          this.setData({
            children: children,
            currentChildId: currentChildId,
            isPageReady: true
          });
          console.log('回退成功获取儿童列表:', children);
          } else {
            console.error('回退数据格式错误，不是数组:', childrenData);
            // 设置空数组避免模板错误，并标记页面准备完成
            this.setData({
              children: [],
              currentChildId: null,
              isPageReady: true
            });
          }
        } else {
          // 设置空数组避免模板错误，并标记页面准备完成
          this.setData({
            children: [],
            currentChildId: null,
            isPageReady: true
          });
        }
        return;
      }

      // 使用新的API接口获取儿童列表
      console.log('调用新API接口，parentId:', userDetail.id);
      const res = await childApi.getChildrenByParent(userDetail.id);
      
      console.log('获取儿童列表响应:', res);
      if (res.statusCode === 200 && res.data) {
        console.log('API响应结构:', res.data);
        
        // 检查响应结构，可能数据在 res.data.data 中
        let childrenData = res.data;
        if (res.data.data && Array.isArray(res.data.data)) {
          childrenData = res.data.data;
          console.log('使用嵌套的data字段:', childrenData);
        } else if (Array.isArray(res.data)) {
          childrenData = res.data;
          console.log('直接使用data字段:', childrenData);
        }
        
        if (Array.isArray(childrenData)) {
          const children = childrenData.map(child => {
            if (!child || typeof child !== 'object') {
              console.warn('无效的儿童数据:', child);
              return null;
            }
            return {
              ...child,
              age: this.calculateAge(child.birth_time)
            };
          }).filter(child => child !== null);
          
          console.log('处理后的儿童数据:', children);
          
          // 更新全局数据
          app.globalData.children = children;
          
          // 存储到storage
          let currentChildId = null;
          if (children.length > 0) {
            wx.setStorageSync('children', children);
            
            // 检查是否已有选中的孩子，如果没有则选择第一个
            const existingCurrentChildId = wx.getStorageSync('currentChildId');
            if (!existingCurrentChildId || !children.find(child => child.id === existingCurrentChildId)) {
              currentChildId = children[0].id;
              wx.setStorageSync('currentChildId', currentChildId);
              app.globalData.nowChildId = currentChildId;
              console.log('设置默认选中孩子:', currentChildId);
            } else {
              // 保持当前选中的孩子
              currentChildId = existingCurrentChildId;
              app.globalData.nowChildId = currentChildId;
              console.log('保持当前选中孩子:', currentChildId);
            }
          }
          
          // 更新页面数据并标记页面准备完成
          this.setData({
            children: children,
            currentChildId: currentChildId,
            isPageReady: true
          });
          console.log('成功获取儿童列表:', children);
        } else {
          console.error('数据格式错误，不是数组:', childrenData);
          // 设置空数组避免模板错误，并标记页面准备完成
          this.setData({
            children: [],
            currentChildId: null,
            isPageReady: true
          });
        }
        
        console.log('页面数据更新完成，children数量:', childrenData.length);
      } else {
        console.log('获取儿童列表失败，状态码:', res.statusCode, '数据:', res.data);
        // 设置空数组避免模板错误，并标记页面准备完成
        this.setData({
          children: [],
          currentChildId: null,
          isPageReady: true
        });
      }
    } catch (error) {
      console.error('获取儿童列表失败:', error);
      wx.showToast({
        title: '获取数据失败',
        icon: 'none'
      });
      // 设置空数组避免模板错误，并标记页面准备完成
      this.setData({
        children: [],
        currentChildId: null,
        isPageReady: true
      });
    }
  },
  setUserType() {
    // 获取 userType，将后端返回的角色转换为前端需要的格式
    const role = app.globalData.userType || wx.getStorageSync('userType') || 'USER';
    let userType = 'parent'; // 默认家长端
    
    // 根据后端角色转换为前端userType
    if (role === 'DOCTOR') {
      userType = 'doctor';
    } else {
      userType = 'parent'; // USER、ADMIN等都显示为家长端
    }
    
    this.setData({ userType });
    console.log('设置userType:', userType, '原始role:', role);
  },

  /**
   * 检查并显示订阅弹窗（仅在登录成功后首次进入时）
   */
  checkAndShowSubscribeModal() {
    // 检查是否支持订阅消息
    if (!wx.canIUse('requestSubscribeMessage')) {
      console.log('当前基础库版本不支持订阅消息');
      return;
    }

    // 检查是否应该显示订阅弹窗（登录成功后设置的标记）
    const shouldShow = wx.getStorageSync('shouldShowSubscribeModal');
    if (!shouldShow) {
      console.log('不需要显示订阅弹窗');
      return;
    }

    // 检查是否已经选择过（包括总是允许）
    const alwaysAllow = wx.getStorageSync('subscribeAlwaysAllow');
    const hasShownBefore = wx.getStorageSync('subscribeModalShown');
    
    // 如果选择了总是允许，清除标记并不显示弹窗
    if (alwaysAllow) {
      console.log('用户已选择总是允许，不显示弹窗');
      wx.removeStorageSync('shouldShowSubscribeModal');
      return;
    }

    // 如果已经显示过，清除标记并不再显示
    if (hasShownBefore) {
      console.log('订阅弹窗已显示过，不再显示');
      wx.removeStorageSync('shouldShowSubscribeModal');
      return;
    }

    // 显示订阅弹窗
    this.setData({
      showSubscribeModal: true,
      checkInEnabled: false,
      alwaysAllow: false
    });
  },

  /**
   * 切换打卡提醒开关
   */
  toggleCheckIn(e) {
    this.setData({
      checkInEnabled: e.detail.value
    });
  },

  /**
   * 切换总是允许复选框
   */
  toggleAlwaysAllow(e) {
    this.setData({
      alwaysAllow: e.detail.value.length > 0
    });
  },

  /**
   * 拒绝订阅
   */
  onRejectSubscribe() {
    // 如果选择了总是允许，保存设置
    if (this.data.alwaysAllow) {
      wx.setStorageSync('subscribeAlwaysAllow', false);
    }
    wx.setStorageSync('subscribeModalShown', true);
    // 清除登录后显示弹窗的标记
    wx.removeStorageSync('shouldShowSubscribeModal');
    
    this.setData({
      showSubscribeModal: false
    });
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation() {
    // 空函数，用于阻止点击弹窗内容时关闭弹窗
  },

  /**
   * 允许订阅
   */
  async onAllowSubscribe() {
    // 如果选择了总是允许，保存设置
    if (this.data.alwaysAllow) {
      wx.setStorageSync('subscribeAlwaysAllow', true);
    }
    wx.setStorageSync('subscribeModalShown', true);
    // 清除登录后显示弹窗的标记
    wx.removeStorageSync('shouldShowSubscribeModal');

    this.setData({
      showSubscribeModal: false
    });

    // 如果打卡提醒开关是开启的，则请求订阅（同时订阅打卡和报告消息）
    if (this.data.checkInEnabled) {
      try {
        const result = await subscribeAllMessages();
        console.log('订阅消息结果:', result);
      } catch (error) {
        console.error('订阅消息失败:', error);
      }
    }
  }
});
