const { request } = require("../../utils/request");
const { getCurrentUserDetail } = require('../../utils/auth.js');
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
    console.log("选择儿童", selectedId, typeof selectedId);
    
    // 获取当前storage中的孩子列表
    const children = wx.getStorageSync('children') || [];
    console.log('当前storage中的children:', children);
    
    // 确保ID类型一致进行比较
    const selectedChild = children.find(child => child.id == selectedId);
    console.log('找到的选中孩子:', selectedChild);
    
    if (selectedChild) {
      // 将选中的孩子移到数组的第一个位置
      const newChildren = [selectedChild, ...children.filter(child => child.id != selectedId)];
      console.log('重新排序后的children:', newChildren);
      
      // 更新storage - 确保顺序正确保存
      wx.setStorageSync('children', newChildren);
      wx.setStorageSync('currentChildId', selectedId);
      
      // 验证storage是否真的更新了
      const updatedChildren = wx.getStorageSync('children');
      const updatedCurrentId = wx.getStorageSync('currentChildId');
      console.log('验证storage更新 - children:', updatedChildren);
      console.log('验证storage更新 - currentChildId:', updatedCurrentId);
      
      // 更新全局数据
      app.globalData.nowChildId = selectedId;
      app.globalData.children = newChildren;
      
      // 更新页面数据
      this.setData({ 
        nowChildId: selectedId,
        children: newChildren
      });
      
      console.log('已切换孩子，新顺序:', newChildren.map(c => c.name));
      console.log('当前选中的孩子ID:', selectedId);
    } else {
      console.error('未找到选中的孩子，selectedId:', selectedId, 'children:', children);
    }
  },
  async getChildrenList() {
    // 优先从storage读取孩子信息
    const storageChildren = wx.getStorageSync('children');
    const storageCurrentId = wx.getStorageSync('currentChildId');
    
    if (storageChildren && storageChildren.length > 0) {
      console.log('从storage读取孩子信息:', storageChildren);
      app.globalData.children = storageChildren;
      app.globalData.nowChildId = storageCurrentId;
      this.setData({ 
        children: storageChildren,
        nowChildId: storageCurrentId
      });
      return;
    }
    
    if (app.globalData.children.length === 0) {
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
                age: this.calculateAge(child.birth_time)
              }));
              
              // 更新全局数据
              const firstChildId = children.length > 0 ? children[0].id : null;
              app.globalData.nowChildId = firstChildId;
              app.globalData.children = children;
              this.setData({ children });
              this.setData({ nowChildId: firstChildId });
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
              age: this.calculateAge(child.birth_time)
            }));
            
            // 更新全局数据
            const firstChildId = children.length > 0 ? children[0].id : null;
            app.globalData.nowChildId = firstChildId;
            app.globalData.children = children;
            this.setData({ children });
            this.setData({ nowChildId: firstChildId });
            console.log('成功获取儿童列表:', children);
          } else {
            console.error('数据格式错误，不是数组:', childrenData);
            wx.showToast({ title: "数据格式错误", icon: "none" });
          }
        } else {
          console.error('获取儿童列表失败:', res);
        }
      } catch (error) {
        console.error('获取儿童列表失败:', error);
      }
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
