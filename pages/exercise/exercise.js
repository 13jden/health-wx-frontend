const app = getApp();
const { fetchTodayExercise } = require('../../api/exercise');
const { sendVoiceRecord } = require('../../api/chat');

Page({
  data: {
    summary: { totalCalories: 0 },
    records: [],
    recording: false
  },

  async onShow() {
    await this.loadData();
  },

  async loadData() {
    const childId = app.globalData.nowChildId;
    const { list, totalCalories } = await fetchTodayExercise(childId);
    this.setData({ records: list, summary: { totalCalories } });
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
      await sendVoiceRecord({ filePath, childId: app.globalData.nowChildId, extra: { scene: 'exercise' } });
      wx.showToast({ title: '已上传语音', icon: 'success' });
    } catch (err) {
      wx.showToast({ title: '上传失败', icon: 'none' });
    }
  }
});


