const { request } = require("../../utils/request");
const childApi = require("../../api/child");
const app = getApp();

Page({
  data: {
    form: {},
    resultLabel: "",
    showModal: false,
    child: {},
    age: null,
    targetHeight: null,
    heightRange: null
  },
  onShow() {
  },
  onLoad() {
    this.fetchChildInfo();
    this.initForm();
  },

  // 获取儿童信息
  fetchChildInfo() {
    // 从storage获取第一个孩子
    const storageChildren = wx.getStorageSync('children');
    const storageCurrentId = wx.getStorageSync('currentChildId');
    
    let childId;
    if (storageChildren && storageChildren.length > 0) {
      childId = storageCurrentId || storageChildren[0].id;
      console.log('Growth页面从storage获取childId:', childId);
    } else {
      childId = app.globalData.nowChildId;
      console.log('Growth页面从全局数据获取childId:', childId);
    }
    
    if (childId) {
      childApi.getChild(childId).then(res => {
        if (res.statusCode === 200) {
          const child = res.data;
          const age = this.calculateAge(child.birth_time);
          this.setData({ 
            child: child,
            age: age
          });
          this.initForm();
        }
      }).catch(error => {
        console.error('获取儿童详情失败:', error);
      });
    }
  },

  // 初始化表单
  initForm() {
    const child = this.data.child;
    this.setData({
      form: {
        age: this.data.age || 10,
        height: child.height || 135,
        weight: child.weight || 35,
        far_height: 175,
        far_weight: 70,
        mo_height: 160,
        mo_weight: 55
      }
    });
  },

  // 计算年龄
  calculateAge(birth_time) {
    const birthDate = new Date(birth_time);
    const currentDate = new Date();
    return currentDate.getFullYear() - birthDate.getFullYear();
  },
  onInputChange(event) {
    const field = event.currentTarget.dataset.field;
    
    this.setData({ form: { ...this.data.form, [field]: event.detail.value } });
  },
  closeModal() {
    this.setData({ showModal: false });
  },
  onAdd() {
    this.setData({ showModal: true, form: {} });
  },

  onEdit(event) {
    const id = event.currentTarget.dataset.id;
    const record = this.data.growthRecords.find(item => item.id === id);
    this.setData({ showModal: true, form: { ...record } });
  },
  onSave() {
    const form = this.data.form;
    const child = this.data.child;
    
    // 根据父母身高和性别预测目标身高
    const targetHeight = this.calculateTargetHeight(
      form.far_height, 
      form.mo_height, 
      child.gender
    );
    
    // 计算误差范围
    const heightRange = {
      min: targetHeight - 7.5,
      max: targetHeight + 7.5
    };
    
    this.setData({
      targetHeight: targetHeight,
      heightRange: heightRange,
      resultLabel: `预测身高：${targetHeight.toFixed(1)}cm (范围：${heightRange.min.toFixed(1)}-${heightRange.max.toFixed(1)}cm)`
    });
  },

  // 计算目标身高
  calculateTargetHeight(fatherHeight, motherHeight, gender) {
    if (gender === '男') {
      // 男孩身高 = (父亲身高 + 母亲身高 + 13) ÷ 2
      return (fatherHeight + motherHeight + 13) / 2;
    } else {
      // 女孩身高 = (父亲身高 + 母亲身高 - 13) ÷ 2
      return (fatherHeight + motherHeight - 13) / 2;
    }
  },
});
