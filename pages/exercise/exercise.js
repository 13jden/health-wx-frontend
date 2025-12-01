const app = getApp();
const { getExerciseRecords, addQuickRecord } = require('../../api/exercise');

Page({
  data: {
    groupedRecords: [],
    showModal: false,
    inputContent: '',
    submitting: false
  },

  async onShow() {
    await this.loadData();
  },

  async loadData() {
    const childId = app.globalData.nowChildId;
    if (!childId) {
      wx.showToast({ title: '请先选择儿童', icon: 'none' });
      return;
    }

    try {
      wx.showLoading({ title: '加载中...' });
      const records = await getExerciseRecords(childId);
      
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
          // 处理不同格式的时间字符串
          let time = new Date(record.createTime);
          // 如果解析失败，尝试处理CST格式
          if (isNaN(time.getTime()) && typeof record.createTime === 'string') {
            // 处理 "Mon Nov 10 00:48:18 CST 2025" 格式，将CST替换为GMT+0800
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

      // 格式化卡路里显示
      let caloriesText = '';
      if (record.caloriesBurned !== undefined && record.caloriesBurned !== null) {
        const calories = parseFloat(record.caloriesBurned);
        if (!isNaN(calories)) {
          // 如果是整数，不显示小数；如果有小数，保留一位小数
          if (calories % 1 === 0) {
            caloriesText = `${calories}卡`;
          } else {
            caloriesText = `${calories.toFixed(1)}卡`;
          }
        }
      }

      groups[dateStr].push({
        ...record,
        timeText,
        caloriesText
      });
    });

    // 转换为数组并排序（最新的在前）
    const sortedDates = Object.keys(groups).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime();
    });

    return sortedDates.map(date => {
      // 格式化日期显示
      const dateObj = new Date(date + 'T00:00:00'); // 添加时间避免时区问题
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
    this.setData({
      showModal: true,
      inputContent: ''
    });
  },

  // 隐藏添加弹窗
  hideAddModal() {
    this.setData({
      showModal: false,
      inputContent: ''
    });
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 空函数，用于阻止点击弹窗内容时关闭弹窗
  },

  // 输入内容变化
  onInputChange(e) {
    this.setData({
      inputContent: e.detail.value
    });
  },

  // 提交记录
  async submitRecord() {
    const content = this.data.inputContent.trim();
    if (!content) {
      wx.showToast({ title: '请输入内容', icon: 'none' });
      return;
    }

    const childId = app.globalData.nowChildId;
    if (!childId) {
      wx.showToast({ title: '请先选择儿童', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });

    try {
      await addQuickRecord(childId, content);
      wx.showToast({ title: '添加成功', icon: 'success' });
      this.hideAddModal();
      // 重新加载数据
      await this.loadData();
    } catch (err) {
      console.error('添加记录失败:', err);
      wx.showToast({ title: '添加失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  }
});


