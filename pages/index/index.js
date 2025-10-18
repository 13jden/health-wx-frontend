const app = getApp();
const { requireLogin } = require('../../utils/auth.js');

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
    isPageReady: false // 页面是否准备好
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
    // 获取全局的 userType，这里模拟从后台获取
    this.setUserType();
    this.getChildrenList();
    
    // 添加调试信息
    console.log('页面数据初始化完成:', {
      userType: this.data.userType,
      children: this.data.children,
      swiperList: this.data.swiperList
    });
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
  getChildrenList() {
    console.log('开始获取儿童列表');
    // 每次都重新获取数据，确保数据是最新的
    const { request } = require("../../utils/request");
    request({ url: `/wxapp/children/`, method: "GET" }).then(res => {
      console.log('获取儿童列表响应:', res);
      if (res.statusCode === 200 && res.data && Array.isArray(res.data)) {
        const children = res.data.map(child => {
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
        const firstChildId = children.length > 0 ? children[0].id : null;
        app.globalData.nowChildId = firstChildId;
        app.globalData.children = children;
        
        // 更新页面数据并标记页面准备完成
        this.setData({
          children: children,
          currentChildId: firstChildId,
          isPageReady: true
        });
        
        console.log('页面数据更新完成，children数量:', children.length);
      } else {
        console.log('获取儿童列表失败，状态码:', res.statusCode, '数据:', res.data);
        // 设置空数组避免模板错误，并标记页面准备完成
        this.setData({
          children: [],
          currentChildId: null,
          isPageReady: true
        });
      }
    }).catch(err => {
      console.error('获取儿童列表失败:', err);
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
    });
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
  }
});
