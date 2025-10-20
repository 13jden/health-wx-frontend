const { request } = require("../../utils/request");
const { requireLogin, getCurrentUserDetail } = require('../../utils/auth.js');
const childApi = require('../../api/child');

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

  async getChildrenList() {
    try {
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
            const children = childrenData.map(child => ({
              ...child,
              age: this.calculateAge(child.birthdate || child.birth_time)
            }));
            this.setData({ children });
            console.log('回退成功获取儿童列表:', children);
          } else {
            console.error('回退数据格式错误，不是数组:', childrenData);
            wx.showToast({ title: "数据格式错误", icon: "none" });
          }
        }
        return;
      }

      // 使用新的API接口获取儿童列表
      console.log('调用新API接口，parentId:', userDetail.id);
      const res = await childApi.getChildrenByParent(userDetail.id);
      
      console.log('新API响应:', res);
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
          const children = childrenData.map(child => ({
            ...child,
            age: this.calculateAge(child.birthdate || child.birth_time)
          }));
          this.setData({ children });
          console.log('成功获取儿童列表:', children);
        } else {
          console.error('数据格式错误，不是数组:', childrenData);
          wx.showToast({ title: "数据格式错误", icon: "none" });
        }
      } else {
        console.error('获取儿童列表失败:', res);
        wx.showToast({ title: "获取儿童列表失败", icon: "none" });
      }
    } catch (error) {
      console.error('获取儿童列表失败:', error);
      wx.showToast({ title: "网络错误", icon: "none" });
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
    this.setData({
      showChildModal: true,
      isEditing: false,
      name: "",
      genderIndex: 0,
      birthdate: "",
      height: "",
      weight: "",
      bmi: "",
      boneAge: "",
      testDate: ""
    });
  },

    onEditChild(event) {
      const childId = event.currentTarget.dataset.id;
      const child = this.data.children.find(c => c.id === childId);
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
      
      // 如果已有身高体重数据，重新计算BMI
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

  async onSaveChild() {
    const { name, genderIndex, genderOptions, birthdate, height, weight, bmi, boneAge, testDate, isEditing, editChildId } = this.data;
    
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

    try {
      // 获取当前用户信息
      const userDetail = await getCurrentUserDetail();
      if (!userDetail || !userDetail.id) {
        wx.showToast({ title: "无法获取用户信息", icon: "none" });
        return;
      }

      const data = {
        name: name.trim(),
        gender: genderOptions[genderIndex],
        birthdate: birthdate,
        parentId: userDetail.id, // 添加parentId
        height: height && height.trim() ? parseFloat(height) : null,
        weight: weight && weight.trim() ? parseFloat(weight) : null,
        bmi: bmi && bmi.trim() ? parseFloat(bmi) : null,
        boneAge: boneAge && boneAge.trim() ? parseFloat(boneAge) : null,
        testDate: testDate || null
      };
      
      if (isEditing) {
        // 使用childApi更新儿童信息
        await childApi.updateChild(editChildId, data);
        wx.showToast({ title: "更新成功", icon: "success" });
      } else {
        // 使用childApi添加儿童信息
        await childApi.addChild(data);
        wx.showToast({ title: "添加成功", icon: "success" });
      }
      
      this.setData({ showChildModal: false });
      this.getChildrenList();
    } catch (error) {
      console.error('保存儿童信息失败:', error);
      wx.showToast({ title: "保存失败", icon: "none" });
    }
  },
  // 删除宝宝
  onDeleteChild(event) {
    const childId = event.currentTarget.dataset.id;
    wx.showModal({
      title: "确认删除？",
      content: "删除后不可恢复",
      success: async (res) => {
        if (res.confirm) {
          try {
            // 使用childApi删除儿童信息
            await childApi.deleteChild(childId);
            wx.showToast({ title: "删除成功", icon: "success" });
            this.getChildrenList();
          } catch (error) {
            console.error('删除儿童失败:', error);
            wx.showToast({ title: "删除失败", icon: "none" });
          }
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
