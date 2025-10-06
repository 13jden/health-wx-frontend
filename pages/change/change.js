const { request } = require("../../utils/request");
const app = getApp();
Page({
  data: {
    showChildModal: false,
    name: "",
    nowChildId: null,
    genderOptions: ["男", "女"],
    genderIndex: 0,
    birth_time: "",
    children: [],
    isEditing: false,
    editChildId: null
  },

  // 获取孩子列表
  onLoad() {
    this.getChildrenList();
  },
  selectChild(event) {
    const selectedId = event.currentTarget.dataset.id;
    console.log("选择儿童",selectedId)
  app.globalData.nowChildId = selectedId; // 更新全局变量
    this.setData({ nowChildId: selectedId }); // 更新 UI
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
        this.setData({ children });
        app.globalData.nowChildId =firstChildId
        app.globalData.children = children;
        this.setData({ nowChildId: firstChildId });
      });
    } else {
      // 更新当前页面数据
    this.setData({
      children: app.globalData.children,
      nowChildId: app.globalData.nowChildId
    });
    }
   
  },

  calculateAge(birth_time) {
    const birthDate = new Date(birth_time);
    const currentDate = new Date();
    return currentDate.getFullYear() - birthDate.getFullYear();
  },







});
