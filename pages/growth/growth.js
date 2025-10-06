const { request } = require("../../utils/request");

const app = getApp();

Page({
  data: {
    form:{},
    resultLabel : "",
    showModal: false,
  },
  onShow() {
  },
  onLoad() {
    this.setData({
      form: {
      fsh: 4.5,
      lh: 3.2,
      age: 10,
      height: 135,
      weight: 35,
      waistline: 60,
      hip: 70,
      far_height: 175,
      far_weight: 70,
      mo_height: 160,
      mo_weight: 55
      }
    });
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
    console.log("222")
    const url = '/wxapp/predict/'
    const method =  'POST';
  
    request({ url, method, data: { ...this.data.form } }).then((res) => {
      this.setData({ resultLabel: res.data.result});
      this.closeModal();
    })
  },
});
