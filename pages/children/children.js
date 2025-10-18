const { request } = require("../../utils/request");
const { requireLogin } = require('../../utils/auth.js');

Page({
  data: {
    showChildModal: false,
    name: "",
    genderOptions: ["男", "女"],
    genderIndex: 0,
    birth_time: "",
    children: [],
    isEditing: false,
    editChildId: null
  },

  // 获取孩子列表
  onLoad() {
    // 检查登录状态
    if (!requireLogin()) {
      return;
    }
    this.getChildrenList();
  },

  getChildrenList() {
    const { request } = require("../../utils/request");
    request({ url: `/wxapp/children/`, method: "GET" }).then(res => {
      const children = res.data.map(child => ({
        ...child,
        age: this.calculateAge(child.birth_time)
      }));
      this.setData({ children });
    });
  },

  calculateAge(birth_time) {
    const birthDate = new Date(birth_time);
    const currentDate = new Date();
    return currentDate.getFullYear() - birthDate.getFullYear();
  },

  // 显示添加/编辑弹框
  onShowAddChildModal() {
    this.setData({
      showChildModal: true,
      isEditing: false,
      name: "",
      genderIndex: 0,
      birth_time: ""
    });
  },

  onEditChild(event) {
    const childId = event.currentTarget.dataset.id;
    const child = this.data.children.find(c => c.id === childId);
    this.setData({
      showChildModal: true,
      isEditing: true,
      editChildId: childId,
      name: child.name,
      genderIndex: this.data.genderOptions.indexOf(child.gender),
      birth_time: child.birth_time
    });
  },

  onCancel() {
    this.setData({ showChildModal: false });
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  onGenderChange(e) {
    this.setData({ genderIndex: Number(e.detail.value) });
  },

  onBirthTimeInput(e) {
    this.setData({ birth_time: e.detail.value });
  },

  onSaveChild() {
    const { name, genderIndex, genderOptions, birth_time, isEditing, editChildId } = this.data;
    const method = isEditing ? "PUT" : "POST";
    const url = isEditing ? `/wxapp/children/${editChildId}/` : `/wxapp/children/`;

    
    request({ url, method, data: { name, gender: genderOptions[genderIndex], birth_time } }).then(() => {
      wx.showToast({ title: isEditing ? "更新成功" : "添加成功", icon: "success" });
      this.setData({ showChildModal: false });
      this.getChildrenList();
    });
  },
  // 删除宝宝
  onDeleteChild(event) {
    const childId = event.currentTarget.dataset.id;
    wx.showModal({
      title: "确认删除？",
      content: "删除后不可恢复",
      success: (res) => {
        if (res.confirm) {
          request({
            url: `/wxapp/children/${childId}`,
            method: "DELETE"}).then((res) => {
              wx.showToast({ title: "删除成功", icon: "success" });
              this.getChildrenList();
            })
        }
      }
    })
  },
  // 调转宝宝详情
// 调转宝宝详情
onDetailChild(event) {
  const childId = event.currentTarget.dataset.id;
  console.log("跳转到详情页, 孩子id:", childId);
  
  wx.navigateTo({
    url: `/pages/details/details?childId=${childId}`
  });
}

});
