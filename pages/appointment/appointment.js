const { request } = require("../../utils/request");
const { requireLogin } = require('../../utils/auth.js');

Page({
  data: {
    appointments: [],
    userType: "doctor", // 确保全局变量有 userType
  },

  onLoad() {
    // 检查登录状态
    if (!requireLogin()) {
      return;
    }
    this.getAppointments();
  },

  getAppointments() {
    request({
      url: `/wxapp/appointments/`,
      method: "GET",
    }).then((res) => {
      this.setData({ appointments: res.data });
    });
  },

  updateStatus(event) {
    const { id, status } = event.currentTarget.dataset;
    let newStatus = status === 1 ? 3 : 1; // 1->接受，3->完成

    request({
      url: `/wxapp/appointments/${id}/update-status/`,
      method: "PATCH",
      data: { status: newStatus },
    }).then(() => {
      wx.showToast({ title: "状态更新成功", icon: "success" });
      this.getAppointments();
    });
  },

  viewChildDetail(event) {
    const childId = event.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/details/details?childId=${childId}`,
    });
  },
});
