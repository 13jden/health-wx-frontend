const { requireLogin } = require('../../utils/auth.js');
const app = getApp();

Page({
  data: {
    showChildModal: false,
    name: "",
    genderOptions: ["男", "女"],
    genderIndex: 0,
    birthdate: "",
    height: "",
    weight: "",
    bmi: "",
    boneAge: "",
    testDate: "",
    children: [],
    isEditing: false,
    editChildId: null,
    nowChildId: null
  },

  // 获取孩子列表
  onLoad() {
    if (!requireLogin()) {
      return;
    }
    this.getChildrenList();
  },

  getChildrenList() {
    const storedChildren = wx.getStorageSync('children') || [];
    if (storedChildren.length > 0) {
      const child = storedChildren[0];
      const childWithAge = {
        ...child,
        age: this.calculateAge(child.birthdate || child.birth_time)
      };
      this.setData({ children: [childWithAge], nowChildId: childWithAge.id });
      app.globalData.children = [childWithAge];
      app.globalData.nowChildId = childWithAge.id;
      wx.setStorageSync('children', [childWithAge]);
      wx.setStorageSync('currentChildId', childWithAge.id);
    } else {
      this.setData({ children: [], nowChildId: null });
      app.globalData.children = [];
      app.globalData.nowChildId = null;
      wx.removeStorageSync('currentChildId');
    }
  },

  calculateAge(birthdate) {
    if (!birthdate) return 0;
    const birthDate = new Date(birthdate);
    const currentDate = new Date();
    return currentDate.getFullYear() - birthDate.getFullYear();
  },

  // 显示添加/编辑弹框
  onShowAddChildModal() {
    const existingChild = this.data.children[0];
    if (existingChild) {
      this.setData({
        showChildModal: true,
        isEditing: true,
        editChildId: existingChild.id,
        name: existingChild.name || "",
        genderIndex: this.data.genderOptions.indexOf(existingChild.gender),
        birthdate: existingChild.birthdate || existingChild.birth_time || "",
        height: existingChild.height ? existingChild.height.toString() : "",
        weight: existingChild.weight ? existingChild.weight.toString() : "",
        bmi: existingChild.bmi ? existingChild.bmi.toString() : "",
        boneAge: existingChild.boneAge ? existingChild.boneAge.toString() : "",
        testDate: existingChild.testDate || ""
      });

      if (existingChild.height && existingChild.weight) {
        this.calculateBMI(existingChild.height.toString(), existingChild.weight.toString());
      }
    } else {
      this.setData({
        showChildModal: true,
        isEditing: false,
        editChildId: null,
        name: "",
        genderIndex: 0,
        birthdate: "",
        height: "",
        weight: "",
        bmi: "",
        boneAge: "",
        testDate: ""
      });
    }
  },

  onEditChild(event) {
    const childId = event.currentTarget.dataset.id;
    const child = this.data.children.find(c => c.id === childId);
    if (!child) {
      wx.showToast({ title: "暂无孩子信息", icon: "none" });
      return;
    }
    this.setData({
      showChildModal: true,
      isEditing: true,
      editChildId: childId,
      name: child.name || "",
      genderIndex: this.data.genderOptions.indexOf(child.gender),
      birthdate: child.birthdate || child.birth_time || "",
      height: child.height ? child.height.toString() : "",
      weight: child.weight ? child.weight.toString() : "",
      bmi: child.bmi ? child.bmi.toString() : "",
      boneAge: child.boneAge ? child.boneAge.toString() : "",
      testDate: child.testDate || ""
    });
    
    if (child.height && child.weight) {
      this.calculateBMI(child.height.toString(), child.weight.toString());
    }
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

  onBirthdateChange(e) {
    this.setData({ birthdate: e.detail.value });
  },

  onHeightInput(e) {
    const height = e.detail.value;
    this.setData({ height });
    this.calculateBMI(height, this.data.weight);
  },

  onWeightInput(e) {
    const weight = e.detail.value;
    this.setData({ weight });
    this.calculateBMI(this.data.height, weight);
  },

  onBmiInput(e) {
    this.setData({ bmi: e.detail.value });
  },

  // 自动计算BMI
  calculateBMI(height, weight) {
    if (height && weight && !isNaN(height) && !isNaN(weight)) {
      const heightInM = parseFloat(height) / 100; // 转换为米
      const weightInKg = parseFloat(weight);
      const bmi = (weightInKg / (heightInM * heightInM)).toFixed(1);
      this.setData({ bmi: bmi });
    } else {
      this.setData({ bmi: "" });
    }
  },

  onBoneAgeInput(e) {
    this.setData({ boneAge: e.detail.value });
  },

  onTestDateChange(e) {
    this.setData({ testDate: e.detail.value });
  },

  onSaveChild() {
    const { name, genderIndex, genderOptions, birthdate, height, weight, bmi, boneAge, testDate, isEditing, editChildId, children } = this.data;
    
    // 基本验证
    if (!name.trim()) {
      wx.showToast({ title: "请输入姓名", icon: "none" });
      return;
    }
    
    if (!birthdate) {
      wx.showToast({ title: "请选择出生日期", icon: "none" });
      return;
    }

    // 检查是否有健康数据，如果有则需要检测日期
    const hasHealthData = (height && height.trim()) || (weight && weight.trim()) || (boneAge && boneAge.trim());
    if (hasHealthData && !testDate) {
      wx.showToast({ title: "填写健康数据时请选择检测日期", icon: "none" });
      return;
    }

    const existingChild = children[0];
    const childId = isEditing && editChildId ? editChildId : (existingChild ? existingChild.id : Date.now());

    const data = {
      id: childId,
      name: name.trim(),
      gender: genderOptions[genderIndex],
      birthdate: birthdate,
      height: height && height.trim() ? parseFloat(height) : null,
      weight: weight && weight.trim() ? parseFloat(weight) : null,
      bmi: bmi && bmi.trim() ? parseFloat(bmi) : null,
      boneAge: boneAge && boneAge.trim() ? parseFloat(boneAge) : null,
      testDate: testDate || null
    };

    const childWithAge = {
      ...data,
      age: this.calculateAge(birthdate)
    };

    wx.setStorageSync('children', [childWithAge]);
    wx.setStorageSync('currentChildId', childId);
    app.globalData.children = [childWithAge];
    app.globalData.nowChildId = childId;

    wx.showToast({ title: isEditing ? "更新成功" : "添加成功", icon: "success" });

    this.setData({ showChildModal: false, isEditing: true, editChildId: childId });
    this.getChildrenList();
  },
  // 删除宝宝
  onDeleteChild(event) {
    const childId = event.currentTarget.dataset.id;
    wx.showModal({
      title: "确认删除？",
      content: "删除后不可恢复",
      success: async (res) => {
        if (res.confirm) {
          wx.removeStorageSync('children');
          wx.removeStorageSync('currentChildId');
          app.globalData.children = [];
          app.globalData.nowChildId = null;
          this.setData({ children: [], isEditing: false, editChildId: null, nowChildId: null });
          wx.showToast({ title: "删除成功", icon: "success" });
        }
      }
    })
  },

  // 调转宝宝详情
  onDetailChild(event) {
    const childId = event.currentTarget.dataset.id;
    console.log("跳转到详情页, 孩子id:", childId);
    
    wx.navigateTo({
      url: `/pages/details/details?childId=${childId}`
    });
  }

});
