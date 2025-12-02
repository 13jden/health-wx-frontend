const app = getApp();
const { getDietRecords, uploadDietImage, addQuickRecordByUrls } = require('../../api/diet');
const { autoSubscribeMessage } = require('../../utils/subscribeMessage.js');

Page({
  data: {
    groupedRecords: [],
    showModal: false,
    selectedImages: [], // 已选择的图片路径（本地）
    uploadedImageUrls: [], // 已上传的图片URL
    mealType: '', // 餐次类型：早餐、午餐、晚餐、加餐
    recordTime: '', // 用餐时间
    submitting: false,
    uploading: false,
    mealTypes: ['早餐', '午餐', '晚餐', '加餐']
  },

  async onShow() {
    await this.loadData();
    // 如果用户选择了总是允许，自动订阅打卡消息
    await autoSubscribeMessage('checkin');
  },

  async loadData() {
    const childId = app.globalData.nowChildId;
    if (!childId) {
      wx.showToast({ title: '请先选择儿童', icon: 'none' });
      return;
    }

    try {
      wx.showLoading({ title: '加载中...' });
      const records = await getDietRecords(childId);
      
      // 按日期分组
      const grouped = this.groupRecordsByDate(records);

      this.setData({
        groupedRecords: grouped
      });
    } catch (err) {
      console.error('加载数据失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  // 按日期分组记录
  groupRecordsByDate(records) {
    const groups = {};
    
    records.forEach(record => {
      // 获取日期，优先使用recordDate，其次使用createTime
      let dateStr = '';
      if (record.recordDate) {
        dateStr = record.recordDate.split('T')[0]; // 处理ISO格式日期
      } else if (record.createTime) {
        try {
          let time = new Date(record.createTime);
          // 如果解析失败，尝试处理CST格式
          if (isNaN(time.getTime()) && typeof record.createTime === 'string') {
            const cstTime = record.createTime.replace('CST', 'GMT+0800');
            time = new Date(cstTime);
          }
          if (!isNaN(time.getTime())) {
            const year = time.getFullYear();
            const month = String(time.getMonth() + 1).padStart(2, '0');
            const day = String(time.getDate()).padStart(2, '0');
            dateStr = `${year}-${month}-${day}`;
          } else {
            // 如果还是解析失败，尝试从字符串中提取日期
            const match = record.createTime.match(/(\d{4}-\d{2}-\d{2})/);
            if (match) {
              dateStr = match[1];
            } else {
              dateStr = new Date().toISOString().split('T')[0];
            }
          }
        } catch (e) {
          dateStr = new Date().toISOString().split('T')[0];
        }
      } else {
        dateStr = new Date().toISOString().split('T')[0];
      }

      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }

      // 格式化时间显示
      let timeText = '';
      if (record.createTime) {
        try {
          let time = new Date(record.createTime);
          if (isNaN(time.getTime()) && typeof record.createTime === 'string') {
            const cstTime = record.createTime.replace('CST', 'GMT+0800');
            time = new Date(cstTime);
          }
          if (!isNaN(time.getTime())) {
            timeText = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
          }
        } catch (e) {
          console.error('时间解析失败:', e);
        }
      }

      groups[dateStr].push({
        ...record,
        timeText,
        expanded: false // 添加展开状态
      });
    });

    // 转换为数组并排序（最新的在前）
    const sortedDates = Object.keys(groups).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime();
    });

    return sortedDates.map(date => {
      // 格式化日期显示
      const dateObj = new Date(date + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      dateObj.setHours(0, 0, 0, 0);

      let dateText = '';
      if (dateObj.getTime() === today.getTime()) {
        dateText = '今天';
      } else if (dateObj.getTime() === yesterday.getTime()) {
        dateText = '昨天';
      } else {
        const month = dateObj.getMonth() + 1;
        const day = dateObj.getDate();
        dateText = `${month}月${day}日`;
      }

      // 按时间倒序排列记录
      groups[date].sort((a, b) => {
        const timeA = a.createTime ? new Date(a.createTime) : new Date(0);
        const timeB = b.createTime ? new Date(b.createTime) : new Date(0);
        return timeB - timeA;
      });

      return {
        date,
        dateText,
        records: groups[date]
      };
    });
  },

  // 显示添加弹窗
  showAddModal() {
    // 设置默认时间为当前时间
    const today = new Date();
    const nowTime = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
    
    this.setData({
      showModal: true,
      selectedImages: [],
      uploadedImageUrls: [],
      mealType: '',
      recordTime: nowTime
    });
  },

  // 隐藏添加弹窗
  hideAddModal() {
    this.setData({
      showModal: false,
      selectedImages: [],
      uploadedImageUrls: [],
      mealType: '',
      recordTime: ''
    });
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 空函数，用于阻止点击弹窗内容时关闭弹窗
  },

  // 选择图片
  async chooseImage() {
    const maxCount = 9 - this.data.selectedImages.length;
    if (maxCount <= 0) {
      wx.showToast({ title: '最多选择9张图片', icon: 'none' });
      return;
    }

    try {
      const res = await wx.chooseImage({
        count: maxCount,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });

      this.setData({
        selectedImages: [...this.data.selectedImages, ...res.tempFilePaths]
      });
    } catch (err) {
      console.error('选择图片失败:', err);
    }
  },

  // 删除图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const selectedImages = [...this.data.selectedImages];
    selectedImages.splice(index, 1);
    this.setData({ selectedImages });
  },

  // 预览图片
  previewImage(e) {
    const urls = e.currentTarget.dataset.urls || [];
    const current = e.currentTarget.dataset.current || '';
    if (urls.length > 0) {
      wx.previewImage({
        urls: urls,
        current: current
      });
    }
  },

  // 切换记录展开/收起状态
  toggleRecordExpand(e) {
    const { dateIndex, recordIndex } = e.currentTarget.dataset;
    const groupedRecords = [...this.data.groupedRecords];
    const record = groupedRecords[dateIndex].records[recordIndex];
    
    // 切换展开状态
    record.expanded = !record.expanded;
    
    this.setData({
      groupedRecords
    });
  },

  // 选择餐次类型
  selectMealType(e) {
    const mealType = e.currentTarget.dataset.type;
    this.setData({ mealType });
  },

  // 选择时间
  onTimeChange(e) {
    this.setData({
      recordTime: e.detail.value
    });
  },

  // 提交记录
  async submitRecord() {
    const { selectedImages, mealType, recordTime, uploadedImageUrls } = this.data;
    
    if (selectedImages.length === 0 && uploadedImageUrls.length === 0) {
      wx.showToast({ title: '请至少选择一张图片', icon: 'none' });
      return;
    }

    if (!mealType) {
      wx.showToast({ title: '请选择餐次类型', icon: 'none' });
      return;
    }

    if (!recordTime) {
      wx.showToast({ title: '请选择用餐时间', icon: 'none' });
      return;
    }

    const childId = app.globalData.nowChildId;
    if (!childId) {
      wx.showToast({ title: '请先选择儿童', icon: 'none' });
      return;
    }

    this.setData({ submitting: true, uploading: true });
    wx.showLoading({ title: '上传图片中...' });

    try {
      // 先上传所有图片
      let imageUrls = [...uploadedImageUrls];
      
      for (const imagePath of selectedImages) {
        try {
          const url = await uploadDietImage(imagePath);
          imageUrls.push(url);
        } catch (err) {
          console.error('上传图片失败:', err);
          wx.showToast({ title: '部分图片上传失败', icon: 'none' });
        }
      }

      if (imageUrls.length === 0) {
        wx.hideLoading();
        wx.showToast({ title: '没有可用的图片', icon: 'none' });
        this.setData({ submitting: false, uploading: false });
        return;
      }

      // 更新loading提示
      wx.showLoading({ title: '提交中...' });

      // 自动使用当前日期
      const today = new Date();
      const recordDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      // 提交记录
      await addQuickRecordByUrls(childId, imageUrls, mealType, recordDate, recordTime);
      wx.hideLoading();
      wx.showToast({ title: '添加成功', icon: 'success' });
      this.hideAddModal();
      // 重新加载数据
      await this.loadData();
    } catch (err) {
      console.error('添加记录失败:', err);
      wx.hideLoading();
      wx.showToast({ title: '添加失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false, uploading: false });
    }
  }
});


