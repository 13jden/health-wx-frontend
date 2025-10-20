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
    // 获取屏幕宽度，让图表占满整个容器宽度
    const screenWidth = wx.getSystemInfoSync().windowWidth;
    const cWidth = screenWidth - 40; // 减去容器的padding
    // 增加图表高度
    const cHeight = 500;
    this.setData({ cWidth, cHeight });
  }, 
  onLoad(options) {
    // 从storage获取第一个孩子
    const storageChildren = wx.getStorageSync('children');
    const storageCurrentId = wx.getStorageSync('currentChildId');
    
    let childId;
    if (storageChildren && storageChildren.length > 0) {
      childId = storageCurrentId || storageChildren[0].id;
      console.log('Weight页面从storage获取childId:', childId);
    } else {
      childId = app.globalData.nowChildId;
      console.log('Weight页面从全局数据获取childId:', childId);
    }
    
    this.setData({ childId: childId });
    this.fetchChildInfo();
    this.fetchGrowthRecords();
  },


  // 直接使用实际数据绘制图表的函数
  drawChartWithData(records) {
    console.log('Weight页面使用实际数据绘制图表:', records);
    
    if (!records || records.length === 0) {
      console.log('Weight页面没有数据可绘制');
      return;
    }
    
    // 处理实际数据
    const chartData = this.processGrowthRecordsToChartData(records);
    console.log('Weight页面处理后的图表数据:', chartData);
    
    // 设置数据并绘制图表
    this.setData({ pltData: chartData });
    
    // 延迟绘制图表，确保数据已设置
    setTimeout(() => {
      this.getServerData(chartData);
    }, 100);
  },

  fetchChildInfo() {
    const userType = app.globalData.userType || "parent"; // 默认家长端
    console.log('Weight页面开始获取儿童信息，childId:', this.data.childId);
    
    if (userType == 'doctor') {
      request({ url: `/wxapp/doctor-get-children/?userType=${userType}&childId=${this.data.childId}`, method: 'GET' }).then(res => {
        console.log('医生端获取儿童信息:', res);
        if (res.statusCode === 200) {
          this.setData({ child: res.data, age: this.calculateAge(res.data.birth_time) });
          console.log('医生端设置儿童数据:', res.data);
        }
      }).catch(error => {
        console.error('医生端获取儿童信息失败:', error);
      });
    } else {

      // 使用childApi获取儿童详情
      childApi.getChild(this.data.childId).then(res => {
        console.log('Weight页面儿童详情API返回:', res);
        if (res.statusCode === 200) {
          // 处理嵌套的数据结构
          let childData;
          if (res.data.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
            childData = res.data.data[0];
          } else if (res.data.data && typeof res.data.data === 'object') {
            childData = res.data.data;
          } else {
            childData = res.data;
          }
          console.log('Weight页面处理后的儿童数据:', childData);
          
          // 处理字段名映射
          const child = {
            id: childData.id,
            name: childData.name,
            gender: childData.gender,
            birth_time: childData.birthdate || childData.birth_time, // 兼容两种字段名
            height: childData.height || 0, // 如果为null，设置为0
            weight: childData.weight || 0, // 如果为null，设置为0
            parentId: childData.parentId
          };
          
          console.log('Weight页面最终设置的儿童数据:', child);
          console.log('Weight页面child.height:', child.height);
          console.log('Weight页面child.weight:', child.weight);
          console.log('Weight页面child.birth_time:', child.birth_time);
          
          this.setData({ 
            child: child, 
            age: this.calculateAge(child.birth_time) 
          });
          
          console.log('Weight页面设置后的data.child:', this.data.child);
          console.log('Weight页面设置后的data.age:', this.data.age);
        } else {
          console.error('Weight页面API返回状态码不是200:', res.statusCode);
        }
      }).catch(error => {
        console.error('Weight页面获取儿童详情失败:', error);
        
        // 尝试从storage获取备用数据
        const storageChildren = wx.getStorageSync('children');
        if (storageChildren && storageChildren.length > 0) {
          const currentChild = storageChildren.find(child => child.id == this.data.childId) || storageChildren[0];
          console.log('Weight页面使用storage备用数据:', currentChild);
          this.setData({ 
            child: currentChild, 
            age: this.calculateAge(currentChild.birth_time || currentChild.birthdate) 
          });
        } else {
          // 显示错误提示
          wx.showToast({
            title: '获取儿童信息失败',
            icon: 'error'
          });
        }
      });

      // 使用growth API获取生长记录，然后处理成图表数据
      growthApi.getRecordsByChildId(this.data.childId).then(res => {
        console.log('Weight页面生长记录数据:', res.data)
        console.log('Weight页面数据类型:', typeof res.data)
        console.log('Weight页面是否为数组:', Array.isArray(res.data))
        if (res.statusCode === 200) {
          // 处理生长记录数据，生成图表所需的格式
          const chartData = this.processGrowthRecordsToChartData(res.data);
          console.log('Weight页面处理后的图表数据:', chartData);
          this.setData({ pltData: chartData });
          
          // 延迟绘制图表，确保数据已设置
          setTimeout(() => {
            this.getServerData(chartData);
          }, 100);
        }
      }).catch(error => {
        console.error('Weight页面获取生长记录失败:', error);
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
    } else {
      // 使用新的growth API
      growthApi.getRecordsByChildId(this.data.childId).then(res => {
        if (res.statusCode === 200) {
          this.setData({ growthRecords: res.data });
        }
      }).catch(error => {
        console.error('获取生长记录失败:', error);
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
    console.log('Weight页面计算年龄，出生日期:', birth_time);
    const birthDate = new Date(birth_time);
    const currentDate = new Date();
    console.log('Weight页面出生日期对象:', birthDate);
    console.log('Weight页面当前日期对象:', currentDate);
    
    // 计算年龄（考虑月份）
    let age = currentDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = currentDate.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())) {
      age--;
    }
    
    console.log('Weight页面计算出的年龄:', age);
    
    // 如果年龄为负数，可能是未来日期，显示为0岁
    if (age < 0) {
      console.log('Weight页面年龄为负数，可能是未来日期，显示为0岁');
      return 0;
    }
    
    return age;
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
    this.setData({ form: { ...this.data.form, [field]: event.detail.value } });
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
    
    if (form.id) {
      // 更新记录
      console.log('更新记录，数据:', { ...form, child: childId });
      growthApi.updateRecord(form.id, { ...form, child: childId }).then(() => {
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
      console.log('添加新记录，数据:', { ...form, child: childId });
      growthApi.addRecord({ ...form, child: childId }).then(() => {
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
    console.log('Weight页面开始处理生长记录数据:', records);
    console.log('Weight页面records类型:', typeof records);
    console.log('Weight页面records是否为数组:', Array.isArray(records));
    
    // 处理API返回的数据结构
    let recordsArray = [];
    if (records && typeof records === 'object') {
      // 如果records有data字段，说明是API返回的完整响应
      if (records.data && Array.isArray(records.data)) {
        recordsArray = records.data;
        console.log('Weight页面从API响应的data字段提取数据:', recordsArray);
      }
      // 如果records本身就是数组
      else if (Array.isArray(records)) {
        recordsArray = records;
        console.log('Weight页面records本身就是数组:', recordsArray);
      }
    }
    
    console.log('Weight页面处理后的数组:', recordsArray);
    console.log('Weight页面数组长度:', recordsArray.length);
    
    if (!recordsArray || recordsArray.length === 0) {
      console.log('Weight页面没有生长记录数据');
      return {
        x_data: [],
        chirld_height: [],
        chirld_weight: [],
        name: this.data.child.name || '儿童'
      };
    }

    // 按测试时间排序
    const sortedRecords = recordsArray.sort((a, b) => {
      const dateA = new Date(a.testDate || a.test_date || a.createTime || a.create_time);
      const dateB = new Date(b.testDate || b.test_date || b.createTime || b.create_time);
      return dateA - dateB;
    });
    
    console.log('Weight页面按时间排序后的记录:', sortedRecords);
    
    // 提取测试时间作为X轴数据
    const x_data = sortedRecords.map(record => {
      const testDate = record.testDate || record.test_date || record.createTime || record.create_time;
      if (testDate) {
        // 格式化日期为 YYYY-MM-DD 格式
        const date = new Date(testDate);
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      }
      return '未知';
    });

    const chirld_height = sortedRecords.map(record => record.height);
    const chirld_weight = sortedRecords.map(record => record.weight);
    
    console.log('Weight页面提取的X轴数据(测试时间):', x_data);
    console.log('Weight页面提取的身高数据:', chirld_height);
    console.log('Weight页面提取的体重数据:', chirld_weight);

    return {
      x_data,
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
    console.log('Weight页面开始绘制图表，数据:', pltData);
    
    // 检查数据是否为空
    if (!pltData.x_data || pltData.x_data.length === 0 || !pltData.chirld_weight || pltData.chirld_weight.length === 0) {
      console.log('Weight页面没有实际数据，无法绘制图表');
      wx.showToast({
        title: '暂无数据',
        icon: 'none'
      });
      return;
    }
    
    // 只显示实际数据的体重图表
    let res_weight = {
      categories: pltData.x_data,
      series: [
        {
          name: pltData.name + "体重",
          color: "#ff6b6b",
          data: pltData.chirld_weight
        }
      ]
    };
    
    console.log('Weight页面体重图表数据:', res_weight);
    
    this.drawCharts('NwbCBhcNOuQXlMCxznViehwgujHjDjVo-weight', res_weight, "weight");
  },

  drawCharts(id, data, t) {
    const ctx = wx.createCanvasContext(id, this);
    console.log('Weight页面绘制图表:', t, '数据:', data);
    
    // 检查数据是否为空
    if (!data.categories || data.categories.length === 0) {
      console.error('Weight页面图表数据为空，无法绘制');
      return;
    }
    
    if (!data.series || data.series.length === 0 || !data.series[0].data || data.series[0].data.length === 0) {
      console.error('Weight页面图表系列数据为空，无法绘制');
      return;
    }
    
    // 固定图表宽度，不动态调整
    const dataCount = data.categories.length;
    let chartWidth = this.data.cWidth; // 始终使用屏幕宽度
    let enableScroll = false;
    
    // 如果数据点较多，启用滚动但保持固定宽度
    if (dataCount > 6) {
      enableScroll = true;
    }
    
    console.log('Weight页面数据点数量:', dataCount, '图表宽度:', chartWidth, '启用滚动:', enableScroll);
    
    // 根据实际数据动态计算Y轴范围
    const weightData = data.series[0].data;
    const minWeight = Math.min(...weightData);
    const maxWeight = Math.max(...weightData);
    
    // 为体重图表设置合理的Y轴范围
    let yAxisMin, yAxisMax, yAxisSplitNumber;
    if (t === "weight") {
      // 体重图表直接显示0-100kg范围
      yAxisMin = 0;
      yAxisMax = 100;
      yAxisSplitNumber = 20;
    } else {
      // 身高保持原有逻辑
      yAxisMin = 0;
      yAxisMax = 200;
      yAxisSplitNumber = 20;
    }
    
    console.log('体重数据范围:', { minWeight, maxWeight, yAxisMin, yAxisMax, yAxisSplitNumber });
    
    const chartConfig = {
      type: "line",
      context: ctx,
      width: chartWidth,
      height: this.data.cHeight,
      categories: data.categories,
      series: data.series,
      animation: true,
      background: "#FFFFFF",
      color: ["#4facfe", "#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57", "#ff9ff3", "#54a0ff"],
      padding: [15, 10, 0, 15],
      enableScroll: enableScroll,
      touchMoveLimit: 60, // 添加触摸移动限制
      legend: {
        show: true,
        position: "bottom"
      },
      dataLabel: true,
      xAxis: {
        disableGrid: false,
        scrollShow: enableScroll,
        itemCount: data.categories.length,
        labelCount: data.categories.length, // 显示所有日期标签
        boundaryGap: "justify",
        fontSize: 10,
        rotateLabel: true, // 旋转标签避免重叠
        labelCount: Math.min(8, data.categories.length), // 限制显示数量避免重叠
        scrollAlign: "left" // 添加滚动对齐方式
      },
      yAxis: {
        gridType: "dash",
        dashLength: 2,
        title: "体重(kg)",
        min: yAxisMin,
        max: yAxisMax,
        splitNumber: yAxisSplitNumber,
        format: function (val) {
          return val + "kg";
        }
      },
      extra: {
        line: {
          type: "curve",
          width: 3,
          activeType: "hollow"
        },
        tooltip: {
          showBox: true,
          showArrow: true,
          showCategory: true,
          borderWidth: 0,
          borderRadius: 0,
          borderColor: "#000000",
          bgColor: "#000000",
          gridType: "solid",
          fontColor: "#FFFFFF"
        }
      }
    };
    
    uChartsInstance[id] = new uCharts(chartConfig);
    console.log('Weight页面图表绘制完成:', t);
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
