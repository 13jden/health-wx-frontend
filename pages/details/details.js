const { request } = require("../../utils/request");
const childApi = require("../../api/child");
const growthApi = require("../../api/growth");
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
    // 优先使用传入的childId，如果没有则从storage获取第一个孩子
    let childId = options.childId;
    
    if (!childId) {
      // 从storage获取第一个孩子
      const storageChildren = wx.getStorageSync('children');
      const storageCurrentId = wx.getStorageSync('currentChildId');
      
      if (storageChildren && storageChildren.length > 0) {
        childId = storageCurrentId || storageChildren[0].id;
        console.log('从storage获取childId:', childId);
      } else {
        childId = app.globalData.nowChildId;
        console.log('从全局数据获取childId:', childId);
      }
    }
    
    console.log('Details页面childId:', childId);
    this.setData({ childId: childId });
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

      // 使用childApi获取儿童详情
      childApi.getChild(this.data.childId).then(res => {
        console.log('儿童详情API返回:', res);
        if (res.statusCode === 200) {
          // 处理API返回的数据结构
          const childData = res.data.data || res.data;
          console.log('处理后的儿童数据:', childData);
          
          // 处理字段名映射
          const child = {
            id: childData.id,
            name: childData.name,
            gender: childData.gender,
            birth_time: childData.birthdate || childData.birth_time, // 兼容两种字段名
            height: childData.height,
            weight: childData.weight,
            parentId: childData.parentId
          };
          
          console.log('最终设置的儿童数据:', child);
          console.log('计算的年龄:', this.calculateAge(child.birth_time));
          
          this.setData({ 
            child: child, 
            age: this.calculateAge(child.birth_time) 
          });
        }
      }).catch(error => {
        console.error('获取儿童详情失败:', error);
      });

      // 使用growth API获取生长记录，然后处理成图表数据
      growthApi.getRecordsByChildId(this.data.childId).then(res => {
        console.log('生长记录数据:', res.data)
        console.log('数据类型:', typeof res.data)
        console.log('是否为数组:', Array.isArray(res.data))
        if (res.statusCode === 200) {
          // 处理生长记录数据，生成图表所需的格式
          const chartData = this.processGrowthRecordsToChartData(res.data);
          this.setData({ pltData: chartData });
          this.getServerData(chartData);
        }
      }).catch(error => {
        console.error('获取生长记录失败:', error);
      })
    }

  },

  fetchGrowthRecords() {
    const userType = app.globalData.userType || "parent"; // 默认家长端
    if (userType == 'doctor') {
      // 使用真实的API获取医生端生长记录数据
      request({ url: `/wxapp/doctor-get-children-info/?childId=${this.data.childId}`, method: 'GET' }).then(res => {
        console.log('医生端生长记录API返回:', res);
        if (res.statusCode === 200) {
          // 处理API返回的数据结构
          const records = res.data.data || res.data || [];
          console.log('处理后的生长记录数据:', records);
          
          // 处理字段名映射，确保显示时使用正确的字段名
          const processedRecords = records.map(record => ({
            id: record.id,
            height: record.height,
            weight: record.weight,
            bmi: record.bmi,
            boneAge: record.boneAge || record.bone_age, // 后端返回boneAge，兼容bone_age
            testDate: record.testDate || record.test_date, // 后端返回testDate，兼容test_date
            createTime: record.createTime || record.create_time
          }));
          
          this.setData({ growthRecords: processedRecords });
        }
      }).catch(error => {
        console.error('获取医生端生长记录失败:', error);
        // 如果API调用失败，设置为空数组
        this.setData({ growthRecords: [] });
      });
    } else {
      // 使用growth API获取生长记录
      growthApi.getRecordsByChildId(this.data.childId).then(res => {
        console.log('家长端生长记录API返回:', res);
        if (res.statusCode === 200) {
          // 处理API返回的数据结构
          const records = res.data.data || res.data || [];
          console.log('处理后的生长记录数据:', records);
          
          // 处理字段名映射，确保显示时使用正确的字段名
          const processedRecords = records.map(record => ({
            id: record.id,
            height: record.height,
            weight: record.weight,
            bmi: record.bmi,
            boneAge: record.boneAge || record.bone_age, // 后端返回boneAge，兼容bone_age
            testDate: record.testDate || record.test_date, // 后端返回testDate，兼容test_date
            createTime: record.createTime || record.create_time
          }));
          
          this.setData({ growthRecords: processedRecords });
        }
      }).catch(error => {
        console.error('获取生长记录失败:', error);
        // 如果API调用失败，设置为空数组
        this.setData({ growthRecords: [] });
      });
    }
  },

  onAdd() {
    // 设置默认检测日期为今天
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + 
      String(today.getMonth() + 1).padStart(2, '0') + '-' + 
      String(today.getDate()).padStart(2, '0');
    
    this.setData({ 
      showModal: true, 
      form: { 
        testDate: todayStr 
      } 
    });
  },

  onEdit(event) {
    const id = event.currentTarget.dataset.id;
    const record = this.data.growthRecords.find(item => item.id === id);
    
    // 处理字段名映射，将后端字段名转换为前端使用的字段名
    const formData = {
      id: record.id,
      height: record.height,
      weight: record.weight,
      bmi: record.bmi,
      boneAge: record.boneAge || record.bone_age, // 后端返回boneAge，兼容bone_age
      testDate: record.testDate || record.test_date, // 后端返回testDate，兼容test_date
      createTime: record.createTime || record.create_time
    };
    
    this.setData({ showModal: true, form: formData });
  },
  calculateAge(birth_time) {
    console.log('计算年龄，出生日期:', birth_time);
    if (!birth_time) {
      console.log('出生日期为空，返回0');
      return 0;
    }
    
    const birthDate = new Date(birth_time);
    const currentDate = new Date();
    
    // 检查日期是否有效
    if (isNaN(birthDate.getTime())) {
      console.log('无效的出生日期，返回0');
      return 0;
    }
    
    // 检查是否是未来日期
    if (birthDate > currentDate) {
      console.log('出生日期是未来日期，返回0');
      return 0;
    }
    
    let age = currentDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = currentDate.getMonth() - birthDate.getMonth();
    
    // 如果还没到生日，年龄减1
    if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())) {
      age--;
    }
    
    console.log('计算的年龄:', age);
    return Math.max(0, age); // 确保年龄不为负数
  },
  onDelete(event) {
    const id = event.currentTarget.dataset.id;
    growthApi.deleteRecord(id).then(() => {
      this.fetchGrowthRecords();
    }).catch(error => {
      console.error('删除记录失败:', error);
    });
  },

  onInputChange(event) {
    const field = event.currentTarget.dataset.field;
    const value = event.detail.value;
    
    this.setData({ form: { ...this.data.form, [field]: value } });
    
    // 自动计算BMI
    if (field === 'height' || field === 'weight') {
      this.calculateBMI();
    }
  },

  onDateChange(event) {
    this.setData({ 
      form: { ...this.data.form, testDate: event.detail.value } 
    });
  },

  calculateBMI() {
    const { height, weight } = this.data.form;
    if (height && weight && height > 0 && weight > 0) {
      const heightInM = height / 100; // 转换为米
      const bmi = (weight / (heightInM * heightInM)).toFixed(1);
      this.setData({ 
        form: { ...this.data.form, bmi: bmi } 
      });
    }
  },

  onSave() {
    const form = this.data.form;
    const childId = this.data.childId;
    
    console.log('保存生长记录，childId:', childId);
    console.log('表单数据:', form);
    
    if (!childId) {
      console.error('childId为空，无法保存记录');
      wx.showToast({
        title: '儿童ID缺失，无法保存',
        icon: 'error'
      });
      return;
    }
    
    // 处理字段名映射，将前端字段名转换为后端期望的字段名
    const recordData = {
      height: form.height,
      weight: form.weight,
      bmi: form.bmi,
      boneAge: form.boneAge, // 后端期望boneAge
      testDate: form.testDate, // 后端期望testDate
      childId: childId // 后端期望childId
    };
    
    if (form.id) {
      // 更新记录
      console.log('更新记录，数据:', { ...recordData, id: form.id });
      growthApi.updateRecord(form.id, recordData).then(() => {
        this.closeModal();
        this.fetchGrowthRecords();
        wx.showToast({
          title: '更新成功',
          icon: 'success'
        });
      }).catch(error => {
        console.error('更新记录失败:', error);
        wx.showToast({
          title: '更新失败',
          icon: 'error'
        });
      });
    } else {
      // 添加新记录
      console.log('添加新记录，数据:', recordData);
      growthApi.addRecord(recordData).then(() => {
        this.closeModal();
        this.fetchGrowthRecords();
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
      }).catch(error => {
        console.error('添加记录失败:', error);
        wx.showToast({
          title: '保存失败',
          icon: 'error'
        });
      });
    }
  },

  closeModal() {
    this.setData({ showModal: false });
  },

  // 处理生长记录数据，转换为图表所需格式
  processGrowthRecordsToChartData(records) {
    // 确保records是数组
    const recordsArray = Array.isArray(records) ? records : [];
    
    if (!recordsArray || recordsArray.length === 0) {
      return {
        x_data: [],
        height_p3_data: [],
        height_p50_data: [],
        height_p97_data: [],
        weigeht_p3_data: [],
        weigeht_p50_data: [],
        weigeht_p97_data: [],
        chirld_height: [],
        chirld_weight: [],
        name: this.data.child.name || '儿童'
      };
    }

    // 按日期排序 - 处理可能的日期格式差异
    const sortedRecords = recordsArray.sort((a, b) => {
      const dateA = new Date(a.testDate);
      const dateB = new Date(b.testDate);
      return dateA - dateB;
    });
    
    // 提取数据
    const x_data = sortedRecords.map(record => {
      const testDate = new Date(record.testDate);
      const birthDate = new Date(this.data.child.birth_time);
      const ageInMonths = (testDate.getFullYear() - birthDate.getFullYear()) * 12 + 
                          (testDate.getMonth() - birthDate.getMonth());
      return (ageInMonths / 12).toFixed(1); // 转换为年
    });

    const chirld_height = sortedRecords.map(record => record.height);
    const chirld_weight = sortedRecords.map(record => record.weight);

    // 生成标准生长曲线数据（这里需要根据实际的标准数据来生成）
    // 暂时使用示例数据，实际应该从标准生长曲线数据中获取
    const height_p3_data = this.generateStandardCurve(x_data, 'height', 3);
    const height_p50_data = this.generateStandardCurve(x_data, 'height', 50);
    const height_p97_data = this.generateStandardCurve(x_data, 'height', 97);
    const weigeht_p3_data = this.generateStandardCurve(x_data, 'weight', 3);
    const weigeht_p50_data = this.generateStandardCurve(x_data, 'weight', 50);
    const weigeht_p97_data = this.generateStandardCurve(x_data, 'weight', 97);

    return {
      x_data,
      height_p3_data,
      height_p50_data,
      height_p97_data,
      weigeht_p3_data,
      weigeht_p50_data,
      weigeht_p97_data,
      chirld_height,
      chirld_weight,
      name: this.data.child.name || '儿童'
    };
  },

  // 生成标准生长曲线数据（示例实现，实际应该使用真实的标准数据）
  generateStandardCurve(ages, type, percentile) {
    return ages.map(age => {
      const ageNum = parseFloat(age);
      if (type === 'height') {
        // 示例身高曲线公式（实际应该使用WHO标准数据）
        if (percentile === 3) return 45 + ageNum * 6; // 3%线
        if (percentile === 50) return 50 + ageNum * 7; // 50%线
        if (percentile === 97) return 55 + ageNum * 8; // 97%线
      } else if (type === 'weight') {
        // 示例体重曲线公式（实际应该使用WHO标准数据）
        if (percentile === 3) return 3 + ageNum * 1.5; // 3%线
        if (percentile === 50) return 3.5 + ageNum * 2; // 50%线
        if (percentile === 97) return 4 + ageNum * 2.5; // 97%线
      }
      return 0;
    });
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
