const { request } = require("../../utils/request");
import uCharts from '../../js_sdk/u-charts/u-charts.js';
const app = getApp();
var uChartsInstance = {};
Page({
  data: {
    childId: null,
    child: {},
    age:null,
    growthRecords: [],
    pltData:{},
    showModal: false,
    form: {},
    userType : app.globalData.userType || "parent",
    cWidth: 750,
    cHeight: 500
  },
  onReady() {
    //这里的第一个 750 对应 css .charts 的 width
    const cWidth = 750 / 750 * wx.getSystemInfoSync().windowWidth;
    //这里的 500 对应 css .charts 的 height
    const cHeight = 500 / 750 * wx.getSystemInfoSync().windowWidth;
    this.setData({ cWidth, cHeight });
   
  },
  onLoad(options) {
    this.setData({ childId: app.globalData.nowChildId });
    this.fetchChildInfo();
    this.fetchGrowthRecords();

  },

  fetchChildInfo() {
    const userType = app.globalData.userType || "parent"; // 默认家长端
    if (userType == 'doctor') {
      request({ url: `/wxapp/doctor-get-children/?userType=${userType}&childId=${this.data.childId}`, method: 'GET' }).then(res => {
        if (res.statusCode === 200) {
          this.setData({ child: res.data, age: this.calculateAge(res.data.birth_time) });
        }
      });
    } else {

      request({ url: `/wxapp/children/${this.data.childId}/`, method: 'GET' }).then(res => {
        if (res.statusCode === 200) {
          this.setData({ child: res.data, age: this.calculateAge(res.data.birth_time) });
        }
      });

      request({ url: `/wxapp/plt-data/?childId=${this.data.childId}`, method: 'GET' }).then(res => {
        console.log(res.data)
        if (res.statusCode === 200) {
          this.setData({ pltData: res.data });
          this.getServerData(res.data);
        }
      })
    }

  },

  fetchGrowthRecords() {
    const userType = app.globalData.userType || "parent"; // 默认家长端
    if (userType == 'doctor') {
      request({ url: `/wxapp/doctor-get-children-info/?childId=${this.data.childId}`, method: 'GET' }).then(res => {
        if (res.statusCode === 200) {
          this.setData({ growthRecords: res.data });
        }
      });

    }else{


      request({ url: `/wxapp/children-info/?childId=${this.data.childId}`, method: 'GET' }).then(res => {
        if (res.statusCode === 200) {
          this.setData({ growthRecords: res.data });
        }
      });

    }

  },

  onAdd() {
    this.setData({ showModal: true, form: {} });
  },

  onEdit(event) {
    const id = event.currentTarget.dataset.id;
    const record = this.data.growthRecords.find(item => item.id === id);
    this.setData({ showModal: true, form: { ...record } });
  },
  calculateAge(birth_time) {
    // console.log(birth_time)
    const birthDate = new Date(birth_time);
    const currentDate = new Date();
    return currentDate.getFullYear() - birthDate.getFullYear();
  },
  onDelete(event) {
    const id = event.currentTarget.dataset.id;
    request({ url: `/wxapp/children-info/${id}/`, method: 'DELETE' }).then(() => this.fetchGrowthRecords());
  },

  onInputChange(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ form: { ...this.data.form, [field]: event.detail.value } });
  },

  onSave() {
    console.log("222")
    const url = this.data.form.id
      ? `/wxapp/children-info/${this.data.form.id}/`
      : `/wxapp/children-info/`;
    const method = this.data.form.id ? 'PUT' : 'POST';
  
    // for (var i=0;i<data_test.length;i++){
    //   console.log(data_test[i])
    //   request({ url, method, data: { ...data_test[i], child: this.data.childId } }).then(() => {
    //     this.closeModal();
    //     this.fetchGrowthRecords();
    //   });
     
    // }
    request({ url, method, data: { ...this.data.form, child: this.data.childId } }).then(() => {
      this.closeModal();
      this.fetchGrowthRecords();
    });
  },

  closeModal() {
    this.setData({ showModal: false });
  },
  getServerData(pltData) {
    //模拟从服务器获取数据时的延时

      let res_height = {
        categories: pltData.x_data,
        series: [
          {
            name: "3%",
            linearColor: [
              [
                0,
                "#1890FF"
              ],
              [
                0.25,
                "#00B5FF"
              ],
              [
                0.5,
                "#00D1ED"
              ],
              [
                0.75,
                "#00E6BB"
              ],
              [
                1,
                "#90F489"
              ]
            ],
            data:pltData.height_p3_data
          },
          {
            name: "50%",
            linearColor: [
              [
                0,
                "#91CB74"
              ],
              [
                0.25,
                "#2BDCA8"
              ],
              [
                0.5,
                "#2AE3A0"
              ],
              [
                0.75,
                "#C4D06E"
              ],
              [
                1,
                "#F2D375"
              ]
            ],
            data: pltData.height_p50_data
          },
          {
            name: "97%",
            linearColor: [
              [
                0,
                "#FAC858"
              ],
              [
                0.33,
                "#FFC371"
              ],
              [
                0.66,
                "#FFC2B2"
              ],
              [
                1,
                "#FA7D8D"
              ]
            ],
            data: pltData.height_p97_data
          },
          {
            name: pltData.name+"身高",
            linearColor: [
              [
                0,
                "#93DEC0"
              ],
          
              [
                1,
                "#00B26A"
              ]
            ],
            data: pltData.chirld_height
          }
        ]
      };

      let res_weight = {
        categories: pltData.x_data,
        series: [
          {
            name: "3%",
            linearColor: [
              [
                0,
                "#1890FF"
              ],
              [
                0.25,
                "#00B5FF"
              ],
              [
                0.5,
                "#00D1ED"
              ],
              [
                0.75,
                "#00E6BB"
              ],
              [
                1,
                "#90F489"
              ]
            ],
            data:pltData.weigeht_p3_data
          },
          {
            name: "50%",
            linearColor: [
              [
                0,
                "#91CB74"
              ],
              [
                0.25,
                "#2BDCA8"
              ],
              [
                0.5,
                "#2AE3A0"
              ],
              [
                0.75,
                "#C4D06E"
              ],
              [
                1,
                "#F2D375"
              ]
            ],
            data: pltData.weigeht_p50_data
          },
          {
            name: "97%",
            linearColor: [
              [
                0,
                "#FAC858"
              ],
              [
                0.33,
                "#FFC371"
              ],
              [
                0.66,
                "#FFC2B2"
              ],
              [
                1,
                "#FA7D8D"
              ]
            ],
            data: pltData.weigeht_p97_data
          },
          {
            name: pltData.name+"体重",
            linearColor: [
              [
                0,
                "#93DEC0"
              ],
          
              [
                1,
                "#00B26A"
              ]
            ],
            data: pltData.chirld_weight
          }
        ]
      };
      this.drawCharts('NwbCBhcNOuQXlMCxznViehwgujHjDjVo-height', res_height,"height");
      this.drawCharts('NwbCBhcNOuQXlMCxznViehwgujHjDjVo-weight', res_weight,"weight");
 
  },

  drawCharts(id,data,t){
    const ctx = wx.createCanvasContext(id, this);
    if (t=="height"){
      uChartsInstance[id] = new uCharts({
        type: "line",
        context: ctx,
        width: this.data.cWidth,
        height: this.data.cHeight,
        categories: data.categories,
        series: data.series,
        animation: true,
        background: "#FFFFFF",
        color: ["#1890FF","#91CB74","#FAC858","#EE6666","#73C0DE","#3CA272","#FC8452","#9A60B4","#ea7ccc"],
        padding: [15,10,0,15],
        enableScroll: true,
        legend: {},
        dataLabel:false,
        xAxis: {
          disableGrid: true,
          scrollShow: true,
          itemCount: 25,
          labelCount:6,
          title:"年龄",
          boundaryGap:"justify"
        },
        yAxis: {
          gridType: "dash",
          dashLength: 1,
        },
        extra: {
          line: {
            type: "straight",
            width: 2,
            activeType: "hollow"
          }
        }
      });
    } 
    if (t="weight"){
      uChartsInstance[id] = new uCharts({
        type: "line",
        context: ctx,
        width: this.data.cWidth,
        height: this.data.cHeight,
        categories: data.categories,
        series: data.series,
        animation: true,
        background: "#FFFFFF",
        color: ["#1890FF","#91CB74","#FAC858","#EE6666","#73C0DE","#3CA272","#FC8452","#9A60B4","#ea7ccc"],
        padding: [15,10,0,15],
        enableScroll: true,
        legend: {},
        dataLabel:false,
        xAxis: {
          disableGrid: true,
          scrollShow: true,
          itemCount: 25,
          labelCount:6,
          title:"年龄",
          boundaryGap:"justify"
        },
        yAxis: {
          gridType: "dash",
          dashLength: 5,
        },
        extra: {
          line: {
            type: "straight",
            width: 2,
            activeType: "hollow"
          }
        }
      });
    }
    
  },
  touchstart(e){
    uChartsInstance[e.target.id].scrollStart(e);
  },
  touchmove(e){
    uChartsInstance[e.target.id].scroll(e);
  },
  touchend(e){
    uChartsInstance[e.target.id].scrollEnd(e);
    uChartsInstance[e.target.id].touchLegend(e);
    uChartsInstance[e.target.id].showToolTip(e);
  }


});
