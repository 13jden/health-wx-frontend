const { request } = require("../../utils/request");
const app = getApp(); // 获取全局变量
Page({
  data: {
    doctors: [],
    selectedDoctorId: null,
    showModal: false,
    appointmentTime: "",
  },

  onLoad() {
    this.getDoctorList();
  },

  getDoctorList() {
    request({
      url: `/wxapp/doctors/`,
      method: "GET",
    }).then((res) => {
      this.setData({ doctors: res.data });
    });
  },

  onShowModal(event) {
    this.setData({
      selectedDoctorId: event.currentTarget.dataset.id,
      showModal: true,
    });
  },

  onCancel() {
    this.setData({ showModal: false });
  },

  onTimeChange(event) {
    this.setData({ appointmentTime: event.detail.value });
  },

  onConfirmAppointment() {
    request({
      url: `/wxapp/appointments/`,
      method: "POST",
      data: {
        doctor: this.data.selectedDoctorId,
        parent: app.globalData.userInfo.id,
        appointment_time: this.data.appointmentTime,
      },
    }).then((res) => {
      wx.showToast({ title: "预约成功", icon: "success" });
      this.setData({ showModal: false });
      this.getDoctorList();
    }).catch(err => {
      if (err.response && err.response.data) {
        const errorMsg = Object.values(err.response.data).flat().join("\n"); // 解析错误信息
        wx.showToast({
          title: errorMsg,
          icon: "none",
          duration: 1000
        });
      }
    });
  },
});
