const { request } = require("../../../../utils/request");
const childApi = require("../../../../api/child");
const growthApi = require("../../../../api/growth");
const echarts = require('../../ec-canvas/echarts.js');
const app = getApp();

// 生成0.5岁间隔的年龄点：2.0, 2.5, 3.0, 3.5, ..., 18.0
const QUARTER_AGES = [];
for (let age = 2; age <= 18; age += 0.5) {
  QUARTER_AGES.push(age);
}

// 整岁数标签（用于X轴显示）
const AGE_CATEGORIES = Array.from({ length: 17 }, (_, idx) => idx + 2); // 2~18岁
const AGE_LABELS = AGE_CATEGORIES.map(age => `${age}岁`);

// 百分位顺序和颜色
const PERCENTILE_ORDER = [3, 10, 25, 50, 75, 90, 97];
const PERCENTILE_COLORS = {
  3: "#89CFF0",
  10: "#5BA8E8",
  25: "#3F8FD0",
  50: "#1E6FB6",
  75: "#3F8FD0",
  90: "#5BA8E8",
  97: "#89CFF0"
};

// 体重百分位数据（2-18岁，每0.5岁一个点，共33个点，单位：kg）
// 数据格式：2.0, 2.5, 3.0, 3.5, ..., 18.0
// 从原来的65个点中提取每0.5岁间隔的数据（索引0, 2, 4, 6...）
const WEIGHT_PERCENTILES_RAW = {
  3:  [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74],
  10: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75],
  25: [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76],
  50: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77],
  75: [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78],
  90: [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79],
  97: [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80]
};

// 提取每0.5岁间隔的数据（索引0, 2, 4, 6...，即每两个取一个）
const WEIGHT_PERCENTILES = {};
PERCENTILE_ORDER.forEach(percentile => {
  WEIGHT_PERCENTILES[percentile] = WEIGHT_PERCENTILES_RAW[percentile].filter((_, index) => index % 2 === 0);
});

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
    ec: {
      onInit: null
    },
    showTooltip: false,
    tooltipData: {
      ageLabel: '',
      items: [],
      x: 0,
      y: 0
    }
  },
  onReady() {
    // 初始化图表（ECharts）
    this.initChart();
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


  // 初始化 ECharts 图表
  initChart() {
    const that = this;
    this.setData({
      ec: {
        onInit: function (canvas, width, height, dpr) {
          // 为 canvas 添加必要的方法（防止 echarts 调用不存在的方法）
          if (!canvas.addEventListener) {
            canvas.addEventListener = function() {};
          }
          if (!canvas.removeEventListener) {
            canvas.removeEventListener = function() {};
          }
          if (!canvas.setChart) {
            canvas.setChart = function(chart) {
              this._chart = chart;
            };
          }
          
          // 初始化 echarts
          const chart = echarts.init(canvas, null, {
            width: width,
            height: height,
            devicePixelRatio: dpr
          });
          
          // 建立 canvas 和 chart 的关联
          canvas.setChart(chart);
          
          that.chart = chart;
          
          // 等待数据加载后再渲染
          setTimeout(() => {
            if (that.data.pltData && (that.data.pltData.x_data || that.data.pltData.measurements)) {
              that.renderCharts(that.data.pltData);
            }
          }, 100);
          
          return chart;
        },
        // 自定义触摸结束回调：根据点击位置计算并显示该年龄点的多条曲线数据
        onTouchEnd: function (x, y, chart) {
          if (!chart) {
            chart = that.chart;
          }
          if (!chart) return;
          that.handleChartTouch(x, y, chart);
        }
      }
    });
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
          this.renderCharts(chartData);
        }
      }).catch(error => {
        console.error('Weight页面获取生长记录失败:', error);
        // 即使获取失败，也显示标准曲线
        const chartData = { x_data: [], chirld_weight: [], name: this.data.child.name || '儿童' };
        this.setData({ pltData: chartData });
        this.renderCharts(chartData);
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

  // 计算精确年龄（以年为单位，包括小数部分）
  calculatePreciseAge(birthDate, testDate) {
    const birth = new Date(birthDate);
    const test = new Date(testDate);
    const diffTime = test - birth;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    const ageYears = diffDays / 365.25; // 考虑闰年
    return Math.max(0, Math.min(18, ageYears)); // 限制在0-18岁之间
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

    // 获取出生日期
    const birthDate = this.data.child.birth_time || this.data.child.birthdate;
    if (!birthDate) {
      console.log('Weight页面没有出生日期，无法计算年龄');
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
    
    // 将测试日期转换为年龄（以年为单位）
    const x_data = sortedRecords.map(record => {
      const testDate = record.testDate || record.test_date || record.createTime || record.create_time;
      if (testDate) {
        const age = this.calculatePreciseAge(birthDate, testDate);
        return age;
      }
      return null;
    }).filter(age => age !== null && age >= 2 && age <= 18); // 只保留2-18岁的数据

    // 过滤掉年龄不在范围内的记录
    const validRecords = sortedRecords.filter((record, index) => {
      const testDate = record.testDate || record.test_date || record.createTime || record.create_time;
      if (testDate) {
        const age = this.calculatePreciseAge(birthDate, testDate);
        return age >= 2 && age <= 18;
      }
      return false;
    });

    const chirld_height = validRecords.map(record => record.height);
    const chirld_weight = validRecords.map(record => record.weight);
    
    console.log('Weight页面提取的X轴数据(年龄):', x_data);
    console.log('Weight页面提取的身高数据:', chirld_height);
    console.log('Weight页面提取的体重数据:', chirld_weight);

    return {
      x_data,
      chirld_height,
      chirld_weight,
      name: this.data.child.name || '儿童'
    };
  },

  // 使用 ECharts 渲染体重曲线
  renderCharts(pltData = {}) {
    if (!this.chart) {
      // 图表未初始化时延迟重试
      setTimeout(() => {
        this.renderCharts(pltData);
      }, 100);
      return;
    }

    try {
      const option = this.buildWeightChartOption(pltData);
      this.chart.setOption(option);
    } catch (e) {
      console.error('Weight页面渲染图表失败:', e);
    }
  },

  buildWeightChartOption(pltData) {
    // X 轴：0.5 岁间隔
    const xAxisData = QUARTER_AGES.map(age => age.toFixed(2));

    // 百分位标准曲线
    const percentileSeries = PERCENTILE_ORDER.map(p => ({
      name: `${p}百分位`,
      type: 'line',
      data: WEIGHT_PERCENTILES[p] || [],
      smooth: true,
      lineStyle: {
        width: 2,
        color: PERCENTILE_COLORS[p] || '#cccccc'
      },
      symbol: 'none',
      showSymbol: false
    }));

    // 儿童体重数据映射到最近的 0.5 岁点
    // 注意：非空点数量应该不超过实际记录数量，因此按“记录 -> 轴刻度”的方式映射
    const childWeightData = new Array(QUARTER_AGES.length).fill(null);
    if (pltData && Array.isArray(pltData.x_data) && Array.isArray(pltData.chirld_weight)) {
      pltData.x_data.forEach((ageVal, i) => {
        const weightVal = pltData.chirld_weight[i];
        const numAge = parseFloat(ageVal);
        const numWeight = parseFloat(weightVal);
        if (isNaN(numAge) || isNaN(numWeight)) {
          return;
        }

        // 只处理 2~18 岁之间的数据
        if (numAge < 2 || numAge > 18) {
          return;
        }

        // 找到距离当前年龄最近的 0.5 岁刻度
        let closestIdx = 0;
        let minDiff = Math.abs(numAge - QUARTER_AGES[0]);
        QUARTER_AGES.forEach((age, idx) => {
          const diff = Math.abs(numAge - age);
          if (diff < minDiff) {
            minDiff = diff;
            closestIdx = idx;
          }
        });

        // 只在误差不超过 0.5 岁时落点
        if (minDiff <= 0.5) {
          childWeightData[closestIdx] = {
            value: parseFloat(numWeight.toFixed(1))
          };
        }
      });
    }

    const series = [
      ...percentileSeries,
      {
        name: `${pltData.name || this.data.child.name || '儿童'}体重`,
        type: 'line',
        data: childWeightData,
        smooth: true,
        lineStyle: {
          width: 4,
          color: '#FF6B6B'
        },
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: {
          color: '#FF6B6B'
        }
      }
    ];

    return {
      tooltip: {
        show: true,
        trigger: 'axis',
        confine: true,
        axisPointer: {
          type: 'cross',
          snap: true
        },
        backgroundColor: 'rgba(50, 50, 50, 0.85)',
        borderWidth: 0,
        padding: [8, 12],
        renderMode: 'richText',
        formatter: function (params) {
          console.log('weight 图表 tooltip formatter 调用, params:', params);
          if (!params || !params.length) {
            return '';
          }

          const dataIndex = params[0].dataIndex;
          const ageLabel = QUARTER_AGES[dataIndex] ? `${QUARTER_AGES[dataIndex].toFixed(2)}岁` : '';
          let result = ageLabel ? ageLabel + '\n' : '';

          params.forEach(param => {
            if (param.value === null || param.value === undefined) return;

            const isChild = param.seriesName.indexOf('体重') > -1 && param.data && typeof param.data === 'object';
            const dataValue = (isChild && typeof param.data.value === 'number')
              ? param.data.value
              : (typeof param.value === 'number' ? param.value : null);

            if (dataValue === null || dataValue === undefined || isNaN(dataValue)) return;

            result += `${param.seriesName}: ${dataValue.toFixed(1)}kg\n`;
          });

          return result;
        }
      },
      legend: {
        data: series.map(s => s.name),
        bottom: 0,
        type: 'scroll'
      },
      grid: {
        left: '10%',
        right: '10%',
        bottom: '15%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: xAxisData,
        axisLabel: {
          formatter: function (value, index) {
            const num = parseFloat(value);
            if (isNaN(num)) {
              return '';
            }
            if (num % 1 === 0) {
              const label = `${Math.floor(num)}`;
              // 只有最后一个整数刻度显示“岁”，其余只显示数字
              const LAST_INDEX = xAxisData.length - 1;
              return index === LAST_INDEX ? `${label}岁` : label;
            }
            return '';
          },
          interval: 0,
          rotate: 0
        }
      },
      yAxis: {
        type: 'value',
        name: '体重(kg)',
        min: 0,
        max: 85,
        splitNumber: 17,
        axisLabel: {
          formatter: '{value}kg'
        }
      },
      series
    };
  },

  // 处理图表触摸事件：根据点击的横坐标，计算该年龄点所有曲线的数据并通过自定义 tooltip 显示
  handleChartTouch(x, y, chart) {
    try {
      const option = chart.getOption() || {};
      const seriesArr = option.series || [];
      if (!seriesArr.length) return;

      const pointInPixel = [x, y];
      if (!chart.containPixel || !chart.convertFromPixel) {
        return;
      }

      // 使用最后一条系列（儿童体重线）作为基准系列
      const baseSeriesIndex = seriesArr.length - 1;
      if (!chart.containPixel({ gridIndex: 0 }, pointInPixel)) {
        return;
      }
      const dataIndexArr = chart.convertFromPixel({ seriesIndex: baseSeriesIndex }, pointInPixel);
      const dataIndex = Array.isArray(dataIndexArr) ? dataIndexArr[0] : dataIndexArr;
      if (dataIndex === undefined || dataIndex === null || isNaN(dataIndex)) {
        return;
      }

      // 获取图表容器的位置，计算 tooltip 的绝对位置
      const query = wx.createSelectorQuery().in(this);
      query.select('.chart-section').boundingClientRect((rect) => {
        if (!rect) return;
        
        const ageLabel = QUARTER_AGES[dataIndex] ? `${QUARTER_AGES[dataIndex].toFixed(2)}岁` : '';
        const items = [];

        seriesArr.forEach((s) => {
          const raw = (s.data || [])[dataIndex];
          if (raw === null || raw === undefined) return;
          let v;
          
          if (typeof raw === 'object') {
            v = typeof raw.value === 'number' ? raw.value : null;
          } else {
            v = typeof raw === 'number' ? raw : null;
          }
          if (v === null || v === undefined || isNaN(v)) return;
          
          items.push({
            name: s.name,
            value: `${v.toFixed(1)}kg`
          });
        });

        if (!items.length) return;

        // 计算 tooltip 位置（相对于页面）
        const tooltipX = rect.left + x;
        const tooltipY = rect.top + y;

        // 显示自定义 tooltip
        this.setData({
          showTooltip: true,
          tooltipData: {
            ageLabel: ageLabel,
            items: items,
            x: tooltipX,
            y: tooltipY
          }
        });
      }).exec();
    } catch (e) {
      console.error('处理图表触摸事件失败:', e);
    }
  },

  // 关闭 Tooltip 弹窗
  closeTooltip() {
    this.setData({
      showTooltip: false,
      tooltipData: {
        ageLabel: '',
        items: []
      }
    });
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 空函数，用于阻止点击弹窗内容时关闭弹窗
  }

});

