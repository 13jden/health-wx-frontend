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
    this.setData({ childId: options.childId });
    this.fetchChildInfo();
    this.fetchGrowthRecords();

  },

  fetchChildInfo() {
    const userType = app.globalData.userType || "parent"; // 默认家长端
    if (userType == 'doctor') {
      // 模拟医生端数据
      const mockChildData = {
        id: this.data.childId,
        name: "小明",
        birth_time: "2020-01-15",
        gender: "男",
        parent_name: "张先生",
        parent_phone: "13800138000"
      };
      
      // 模拟PLT数据
      const mockPltData = {
        name: "小明",
        x_data: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24"],
        height_p3_data: [45.4, 50.8, 55.0, 58.1, 60.8, 63.1, 65.0, 66.6, 68.0, 69.2, 70.3, 71.3, 72.2, 73.0, 73.7, 74.4, 75.0, 75.6, 76.1, 76.6, 77.1, 77.5, 77.9, 78.3, 78.7],
        height_p50_data: [49.9, 56.4, 61.4, 65.5, 69.0, 72.0, 74.5, 76.5, 78.2, 79.7, 81.0, 82.2, 83.3, 84.3, 85.2, 86.0, 86.8, 87.5, 88.2, 88.8, 89.4, 90.0, 90.5, 91.0, 91.5],
        height_p97_data: [54.4, 62.0, 67.8, 72.9, 77.2, 80.9, 84.0, 86.5, 88.4, 90.2, 91.7, 93.1, 94.4, 95.6, 96.7, 97.6, 98.6, 99.4, 100.3, 101.0, 101.7, 102.5, 103.1, 103.7, 104.3],
        chirld_height: [50.2, 57.0, 62.5, 66.8, 70.5, 73.8, 76.5, 78.8, 80.8, 82.5, 84.0, 85.3, 86.5, 87.6, 88.6, 89.5, 90.3, 91.0, 91.7, 92.3, 92.9, 93.4, 93.9, 94.4, 94.8],
        weigeht_p3_data: [2.4, 3.2, 4.0, 4.6, 5.1, 5.5, 5.8, 6.1, 6.3, 6.5, 6.7, 6.9, 7.0, 7.2, 7.3, 7.5, 7.6, 7.8, 7.9, 8.0, 8.2, 8.3, 8.4, 8.6, 8.7],
        weigeht_p50_data: [3.3, 4.5, 5.6, 6.4, 7.0, 7.5, 7.9, 8.3, 8.6, 8.9, 9.2, 9.4, 9.6, 9.8, 10.0, 10.2, 10.4, 10.6, 10.8, 11.0, 11.2, 11.4, 11.6, 11.8, 12.0],
        weigeht_p97_data: [4.2, 5.8, 7.2, 8.2, 8.9, 9.5, 10.0, 10.5, 10.9, 11.3, 11.7, 11.9, 12.2, 12.4, 12.7, 12.9, 13.2, 13.4, 13.7, 14.0, 14.2, 14.5, 14.8, 15.0, 15.3],
        chirld_weight: [3.5, 4.8, 6.0, 6.9, 7.6, 8.2, 8.7, 9.1, 9.5, 9.8, 10.1, 10.4, 10.6, 10.9, 11.1, 11.3, 11.6, 11.8, 12.0, 12.3, 12.5, 12.7, 13.0, 13.2, 13.5]
      };
      
      this.setData({ 
        child: mockChildData, 
        age: this.calculateAge(mockChildData.birth_time),
        pltData: mockPltData
      });
      this.getServerData(mockPltData);
      
      // 原始API调用（注释掉，使用模拟数据）
      // request({ url: `/wxapp/doctor-get-children/?userType=${userType}&childId=${this.data.childId}`, method: 'GET' }).then(res => {
      //   if (res.statusCode === 200) {
      //     this.setData({ child: res.data, age: this.calculateAge(res.data.birth_time) });
      //   }
      // });
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
      // 模拟医生端生长记录数据
      const mockGrowthRecords = [
        {
          id: 1,
          date: "2024-01-15",
          height: 85.5,
          weight: 12.3,
          head_circumference: 48.2,
          notes: "生长发育正常，建议继续观察"
        },
        {
          id: 2,
          date: "2024-02-15",
          height: 86.8,
          weight: 12.8,
          head_circumference: 48.5,
          notes: "身高体重增长良好"
        },
        {
          id: 3,
          date: "2024-03-15",
          height: 88.2,
          weight: 13.2,
          head_circumference: 48.8,
          notes: "各项指标正常，建议增加户外活动"
        },
        {
          id: 4,
          date: "2024-04-15",
          height: 89.5,
          weight: 13.6,
          head_circumference: 49.0,
          notes: "生长发育曲线良好"
        }
      ];
      
      this.setData({ growthRecords: mockGrowthRecords });
      
      // 原始API调用（注释掉，使用模拟数据）
      // request({ url: `/wxapp/doctor-get-children-info/?childId=${this.data.childId}`, method: 'GET' }).then(res => {
      //   if (res.statusCode === 200) {
      //     this.setData({ growthRecords: res.data });
      //   }
      // });

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
    if (t=="weight"){
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
