const app = getApp();

Page({
  data: {
    userType: "parent", // 默认是家长端
    swiperList: [
      { imgUrl: "/assets/icons/ind1.jpg"},
      { imgUrl: "/assets/icons/ind2.jpg"},
      { imgUrl: "/assets/icons/ind1.jpg"}
    ]
  },
 // 轮播图点击事件
 onSwiperTap(e) {
  const url = e.currentTarget.dataset.url;
  if (url) {
    wx.navigateTo({ url });
  }
},
  onLoad() {
    // 获取全局的 userType，这里模拟从后台获取
    this.setUserType();
    this.getChildrenList()
  },

  onShow() {
    // 每次显示时，检查并更新 userType
    this.setUserType();
  },
  calculateAge(birth_time) {
    const birthDate = new Date(birth_time);
    const currentDate = new Date();
    return currentDate.getFullYear() - birthDate.getFullYear();
  },
  getChildrenList() {
    if (app.globalData.children.length === 0) {

      const { request } = require("../../utils/request");
      request({ url: `/wxapp/children/`, method: "GET" }).then(res => {
        const children = res.data.map(child => ({
          ...child,
          age: this.calculateAge(child.birth_time)
        }));
            // 更新全局数据
     
      const firstChildId =  children.length > 0 ? children[0].id : null;
      app.globalData.nowChildId =firstChildId
    
        app.globalData.nowChildId =firstChildId
        app.globalData.children = children;
      });
    } 
   
  },
  setUserType() {
    // 获取 userType（这里假设 app.globalData.userType 已经被设置）
    const userType = app.globalData.userType || "parent"; // 默认家长端
    this.setData({ userType });
  }
});
