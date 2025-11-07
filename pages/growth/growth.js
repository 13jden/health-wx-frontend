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
    // 从storage获取当前选中的孩子
    const storageChildren = wx.getStorageSync('children');
    const storageCurrentId = wx.getStorageSync('currentChildId');
    
    let child;
    if (storageChildren && storageChildren.length > 0) {
      if (storageCurrentId) {
        // 根据currentChildId找到对应的child
        child = storageChildren.find(child => child.id === storageCurrentId);
        console.log('Growth页面根据currentChildId找到child:', child);
      }
      
      // 如果没找到或没有currentChildId，使用第一个
      if (!child) {
        child = storageChildren[0];
        console.log('Growth页面使用第一个child:', child);
      }
    }
    
    if (child) {
      console.log('Growth页面child数据:', child);
      console.log('Growth页面birthdate:', child.birthdate);
      
      const age = this.calculateAge(child.birthdate);
      console.log('Growth页面计算出的年龄:', age);
      
      this.setData({ 
        child: child,
        age: age
      });
      this.initForm();
      console.log('Growth页面设置child数据:', child);
    } else {
      console.log('Growth页面未找到child数据');
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
  calculateAge(birthdate) {
    if (!birthdate) {
      console.log('Growth页面birthdate为空');
      return 0;
    }
    
    console.log('Growth页面开始计算年龄，birthdate:', birthdate);
    const birthDate = new Date(birthdate);
    const currentDate = new Date();
    
    console.log('Growth页面birthDate:', birthDate);
    console.log('Growth页面currentDate:', currentDate);
    
    // 检查日期是否有效
    if (isNaN(birthDate.getTime())) {
      console.log('Growth页面birthdate格式无效');
      return 0;
    }
    
    let age = currentDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = currentDate.getMonth() - birthDate.getMonth();
    
    // 如果还没到生日，年龄减1
    if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())) {
      age--;
    }
    
    console.log('Growth页面计算年龄结果:', age);
    return age;
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
