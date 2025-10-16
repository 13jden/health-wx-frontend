const app = getApp();
const { fetchTodayDiet, addDietRecord } = require('../../api/diet');
const { sendVoiceRecord } = require('../../api/chat');

Page({
  data: {
    summary: { totalCalories: 0, basalCalories: 0 },
    records: [],
    recording: false
  },

  async onShow() {
    await this.loadData();
  },

  async loadData() {
    const childId = app.globalData.nowChildId;
    const { list, totalCalories, basalCalories } = await fetchTodayDiet(childId);
    this.setData({
      records: list,
      summary: { totalCalories, basalCalories }
    });
  },

  async onAdd() {
    // 简单示例：添加一条固定记录
    await addDietRecord({
      childId: app.globalData.nowChildId,
      mealType: '加餐',
      foodName: '苹果',
      calories: 95
    });
    wx.showToast({ title: '已添加', icon: 'success' });
    this.loadData();
  },

  onLongPressRecord() {
    if (this.data.recording) return;
    this.setData({ recording: true });
    const recorder = wx.getRecorderManager();
    recorder.onStop = (e) => this.handleRecordStop(e);
    recorder.start({ format: 'mp3' });
    wx.showToast({ title: '正在录音...', icon: 'none', duration: 2000 });
  },

  onStopRecord() {
    if (!this.data.recording) return;
    const recorder = wx.getRecorderManager();
    recorder.stop();
    this.setData({ recording: false });
  },

  async handleRecordStop(e) {
    const filePath = e.tempFilePath;
    try {
      await sendVoiceRecord({ filePath, childId: app.globalData.nowChildId, extra: { scene: 'diet' } });
      wx.showToast({ title: '已上传语音', icon: 'success' });
    } catch (err) {
      wx.showToast({ title: '上传失败', icon: 'none' });
    }
  }
});


