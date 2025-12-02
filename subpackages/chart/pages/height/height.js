const { request } = require("../../../../utils/request");
const childApi = require("../../../../api/child");
const growthApi = require("../../../../api/growth");
const echarts = require('../../ec-canvas/echarts.js');
const app = getApp();

// 生成0.5岁间隔的年龄点：2.0, 2.5, 3.0, ..., 18.0
const QUARTER_AGES = [];
for (let age = 2; age <= 18; age += 0.5) {
  QUARTER_AGES.push(parseFloat(age.toFixed(2)));
}

// 整岁数标签（用于X轴显示）
const AGE_CATEGORIES = Array.from({ length: 17 }, (_, idx) => idx + 2); // 2~18岁
const AGE_LABELS = AGE_CATEGORIES.map(age => `${age}岁`);

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

// 使用季度数据点（根据用户提供的数据）
// 数据顺序：2.0, 2.25, 2.5, 2.75, 3.0, 3.25, ..., 18.0 (共65个点)
const HEIGHT_PERCENTILES_RAW = {
  3:  [82, 83, 84, 85, 87, 88, 89, 90, 92, 93, 94, 95, 97, 98, 99, 100, 102, 103, 104, 105, 107, 108, 109, 110, 112, 113, 114, 115, 117, 118, 119, 120, 122, 123, 124, 125, 127, 128, 129, 130, 132, 133, 134, 135, 137, 138, 139, 140, 142, 143, 144, 145, 147, 148, 149, 150, 152, 153, 154, 155, 157, 158, 159, 160, 161],
  10: [84, 85, 86, 87, 89, 90, 91, 92, 94, 95, 96, 97, 99, 100, 101, 102, 104, 105, 106, 107, 109, 110, 111, 112, 114, 115, 116, 117, 119, 120, 121, 122, 124, 125, 126, 127, 129, 130, 131, 132, 134, 135, 136, 137, 139, 140, 141, 142, 144, 145, 146, 147, 149, 150, 151, 152, 154, 155, 156, 157, 159, 160, 161, 162, 163],
  25: [86, 87, 88, 89, 91, 92, 93, 94, 96, 97, 98, 99, 101, 102, 103, 104, 106, 107, 108, 109, 111, 112, 113, 114, 116, 117, 118, 119, 121, 122, 123, 124, 126, 127, 128, 129, 131, 132, 133, 134, 136, 137, 138, 139, 141, 142, 143, 144, 146, 147, 148, 149, 151, 152, 153, 154, 156, 157, 158, 159, 161, 162, 163, 164, 165],
  50: [87, 88, 89, 90, 92, 93, 94, 95, 97, 98, 99, 100, 102, 103, 104, 105, 107, 108, 109, 110, 112, 113, 114, 115, 117, 118, 119, 120, 122, 123, 124, 125, 127, 128, 129, 130, 132, 133, 134, 135, 137, 139, 141, 143, 146, 148, 150, 152, 155, 157, 160, 162, 165, 167, 169, 171, 173, 174, 175, 176, 177, 178, 178, 179, 179],
  75: [89, 90, 91, 92, 94, 95, 96, 97, 99, 100, 101, 102, 104, 105, 106, 107, 109, 110, 111, 112, 114, 115, 116, 117, 119, 120, 121, 122, 124, 125, 126, 127, 129, 130, 131, 132, 134, 135, 136, 137, 139, 141, 143, 145, 148, 150, 152, 154, 157, 159, 161, 163, 166, 168, 170, 172, 174, 175, 176, 177, 178, 179, 179, 180, 180],
  90: [91, 92, 93, 94, 96, 97, 98, 99, 101, 102, 103, 104, 106, 107, 108, 109, 111, 112, 113, 114, 116, 117, 118, 119, 121, 122, 123, 124, 126, 127, 128, 129, 131, 132, 133, 134, 136, 137, 138, 139, 141, 143, 145, 147, 150, 152, 154, 156, 159, 161, 163, 165, 168, 170, 172, 174, 176, 177, 178, 179, 180, 180, 180, 180, 180],
  97: [93, 94, 95, 96, 98, 99, 100, 101, 103, 104, 105, 106, 108, 109, 110, 111, 113, 114, 115, 116, 118, 119, 120, 121, 123, 124, 125, 126, 128, 129, 130, 131, 133, 134, 135, 136, 138, 139, 140, 141, 143, 145, 147, 149, 152, 154, 156, 158, 161, 163, 165, 167, 170, 172, 174, 176, 178, 179, 180, 180, 180, 180, 180, 180, 180]
};

// 提取每0.5岁间隔的数据（索引0, 2, 4, ...）
const HEIGHT_PERCENTILES = {};
PERCENTILE_ORDER.forEach(percentile => {
  HEIGHT_PERCENTILES[percentile] = (HEIGHT_PERCENTILES_RAW[percentile] || []).filter((_, index) => index % 2 === 0);
});

Page({
  data: {
    childId: null,
    child: {},
    age: null,
    growthRecords: [],
    pltData: {},
    showModal: false,
    form: {},
    userType: app.globalData.userType || "parent",
    selectedPoint: null,
    ec: {
      onInit: null
    }
  },

  onReady() {
    // 初始化图表
    this.initChart();
  },

  onLoad(options) {
    // 从storage获取第一个孩子
    const storageChildren = wx.getStorageSync('children');
    const storageCurrentId = wx.getStorageSync('currentChildId');
    
    let childId;
    if (storageChildren && storageChildren.length > 0) {
      childId = storageCurrentId || storageChildren[0].id;
      console.log('Height页面从storage获取childId:', childId);
    } else {
      childId = app.globalData.nowChildId;
      console.log('Height页面从全局数据获取childId:', childId);
    }
    
    this.setData({ childId: childId });
    this.fetchChildInfo();
    this.fetchGrowthRecords();
  },

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
            if (that.data.pltData && that.data.pltData.measurements) {
              that.renderCharts(that.data.pltData);
            }
          }, 100);
          
          return chart;
        },
        onTouchEnd(x, y, chartInstance) {
          that.handleChartTouch(x, y, chartInstance);
        }
      }
    });
  },

  fetchChildInfo() {
    const userType = app.globalData.userType || "parent"; // 默认家长端
    console.log('Height页面开始获取儿童信息，childId:', this.data.childId);
    
    if (userType == 'doctor') {
      request({ url: `/wxapp/doctor-get-children/?userType=${userType}&childId=${this.data.childId}`, method: 'GET' }).then(res => {
        console.log('医生端获取儿童信息:', res);
        if (res.statusCode === 200) {
          this.setData({ child: res.data, age: this.calculateAge(res.data.birth_time) }, () => {
            this.renderCharts(this.data.pltData || { measurements: [], name: res.data.name || '儿童' });
          });
          console.log('医生端设置儿童数据:', res.data);
        }
      }).catch(error => {
        console.error('医生端获取儿童信息失败:', error);
      });
    } else {
      // 使用childApi获取儿童详情
      childApi.getChild(this.data.childId).then(res => {
        console.log('Height页面儿童详情API返回:', res);
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
          console.log('Height页面处理后的儿童数据:', childData);
          
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
          
          console.log('Height页面最终设置的儿童数据:', child);
          
          this.setData({ 
            child: child, 
            age: this.calculateAge(child.birth_time) 
          }, () => {
            this.renderCharts(this.data.pltData || { measurements: [], name: child.name || '儿童' });
          });
          
          console.log('Height页面设置后的data.child:', this.data.child);
          console.log('Height页面设置后的data.age:', this.data.age);
        } else {
          console.error('Height页面API返回状态码不是200:', res.statusCode);
        }
      }).catch(error => {
        console.error('Height页面获取儿童详情失败:', error);
        
        // 尝试从storage获取备用数据
        const storageChildren = wx.getStorageSync('children');
        if (storageChildren && storageChildren.length > 0) {
          const currentChild = storageChildren.find(child => child.id == this.data.childId) || storageChildren[0];
          console.log('Height页面使用storage备用数据:', currentChild);
          this.setData({ 
            child: currentChild, 
            age: this.calculateAge(currentChild.birth_time || currentChild.birthdate) 
          }, () => {
            this.renderCharts(this.data.pltData || { measurements: [], name: currentChild.name || '儿童' });
          });
        } else {
          // 显示错误提示
          wx.showToast({
            title: '获取儿童信息失败',
            icon: 'error'
          });
        }
      });
    }
  },

  fetchGrowthRecords() {
    const userType = app.globalData.userType || "parent"; // 默认家长端
    if (userType == 'doctor') {
      request({ url: `/wxapp/doctor-get-children-info/?childId=${this.data.childId}`, method: 'GET' }).then(res => {
        if (res.statusCode === 200) {
          this.setData({ growthRecords: res.data || [] });
          // 处理生长记录数据，生成图表所需的格式
          const chartData = this.processGrowthRecordsToChartData(res.data);
          console.log('Height页面医生端处理后的图表数据:', chartData);
          this.setData({ pltData: chartData });
          this.renderCharts(chartData);
        } else {
          // 即使获取失败，也要显示标准曲线
          const chartData = { measurements: [], name: this.data.child.name || '儿童' };
          this.setData({ pltData: chartData });
          this.renderCharts(chartData);
        }
      }).catch(error => {
        console.error('Height页面fetchGrowthRecords获取生长记录失败:', error);
        // 即使获取失败，也要显示标准曲线
        const chartData = { measurements: [], name: this.data.child.name || '儿童' };
        this.setData({ pltData: chartData });
        this.renderCharts(chartData);
      });
    } else {
      // 使用新的growth API
      growthApi.getRecordsByChildId(this.data.childId).then(res => {
        console.log('Height页面fetchGrowthRecords获取生长记录数据:', res.data);
        if (res.statusCode === 200) {
          this.setData({ growthRecords: res.data || [] });
          // 处理生长记录数据，生成图表所需的格式
          const chartData = this.processGrowthRecordsToChartData(res.data);
          console.log('Height页面fetchGrowthRecords处理后的图表数据:', chartData);
          this.setData({ pltData: chartData });
          this.renderCharts(chartData);
        } else {
          // 即使获取失败，也要显示标准曲线
          const chartData = { measurements: [], name: this.data.child.name || '儿童' };
          this.setData({ pltData: chartData });
          this.renderCharts(chartData);
        }
      }).catch(error => {
        console.error('Height页面fetchGrowthRecords获取生长记录失败:', error);
        // 即使获取失败，也要显示标准曲线
        const chartData = { measurements: [], name: this.data.child.name || '儿童' };
        this.setData({ pltData: chartData });
        this.renderCharts(chartData);
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
    console.log('计算年龄，出生日期:', birth_time);
    const birthDate = new Date(birth_time);
    const currentDate = new Date();
    console.log('出生日期对象:', birthDate);
    console.log('当前日期对象:', currentDate);
    
    // 计算年龄（考虑月份）
    let age = currentDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = currentDate.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())) {
      age--;
    }
    
    console.log('计算出的年龄:', age);
    
    // 如果年龄为负数，可能是未来日期，显示为0岁
    if (age < 0) {
      console.log('年龄为负数，可能是未来日期，显示为0岁');
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
    console.log('开始处理生长记录数据:', records);
    
    let recordsArray = [];
    if (records && Array.isArray(records.data)) {
        recordsArray = records.data;
    } else if (Array.isArray(records)) {
        recordsArray = records;
    }
    
    if (!recordsArray || recordsArray.length === 0) {
      return {
        measurements: [],
        name: this.data.child.name || '儿童'
      };
    }

    const birthDateStr = this.data.child.birth_time || this.data.child.birthdate;
    const birthDate = birthDateStr ? new Date(birthDateStr) : null;

    const sortedRecords = recordsArray.sort((a, b) => {
      const dateA = new Date(a.testDate || a.test_date || a.createTime || a.create_time || a.created_at || a.updated_at);
      const dateB = new Date(b.testDate || b.test_date || b.createTime || b.create_time || b.created_at || b.updated_at);
      return dateA - dateB;
    });
    
    const measurements = sortedRecords.map((record, index) => {
      const dateStr = record.testDate || record.test_date || record.createTime || record.create_time || record.created_at || record.updated_at;
      const recordDate = dateStr ? new Date(dateStr) : null;
      const ageInYears = (birthDate && recordDate) ? this.calculateAgeInYearsFromDates(birthDate, recordDate) : null;
      const height = record.height !== undefined ? parseFloat(record.height) : null;
      const weight = record.weight !== undefined ? parseFloat(record.weight) : null;
      
      return {
        dateLabel: recordDate ? this.formatMeasurementDate(recordDate) : `记录${index + 1}`,
        rawDate: dateStr || null,
        ageInYears,
        height: isNaN(height) ? null : height,
        weight: isNaN(weight) ? null : weight
      };
    }).filter(item => item.height !== null || item.weight !== null);

    return {
      measurements,
      name: this.data.child.name || '儿童'
    };
  },

  renderCharts(rawData = {}) {
    if (!this.chart) {
      // 如果图表还未初始化，等待初始化完成
      setTimeout(() => {
        this.renderCharts(rawData);
      }, 100);
      return;
    }

    const childName = rawData.name || this.data.child.name || '儿童';
    const measurements = Array.isArray(rawData.measurements) ? rawData.measurements : [];

    try {
      const option = this.buildHeightChartOption({
        measurements,
        name: childName
      });
      this.chart.setOption(option);
      this.childSeriesIndex = option.series.length - 1;
      this.childHeightData = option.series[this.childSeriesIndex]
        ? option.series[this.childSeriesIndex].data
        : [];
      this.registerChartClickHandler();
    } catch (error) {
      console.error('Height页面渲染图表失败:', error);
    }
  },

  registerChartClickHandler() {
    if (!this.chart) {
      return;
    }
    if (this.chartClickHandler) {
      this.chart.off('click', this.chartClickHandler);
    }
    this.chartClickHandler = (params) => {
      if (!params || !params.data || params.seriesName.indexOf('身高') === -1) {
        return;
      }
      const dataItem = params.data;
      const heightVal = typeof dataItem.value === 'number' ? dataItem.value.toFixed(1) : '--';
      const weightVal = typeof dataItem.weight === 'number' ? dataItem.weight.toFixed(1) : null;

      this.setData({
        selectedPoint: {
          ageLabel: (() => {
            const ageVal = QUARTER_AGES[params.dataIndex];
            return typeof ageVal === 'number' ? `${ageVal.toFixed(2)}岁` : '';
          })(),
          dateLabel: dataItem.dateLabel || '',
          height: heightVal,
          weight: weightVal
        }
      });
    };
    this.chart.on('click', this.chartClickHandler);
  },

  handleChartTouch(x, y, chartInstance) {
    const chart = chartInstance || this.chart;
    if (!chart || !this.childHeightData || !Array.isArray(this.childHeightData)) {
      return;
    }

    try {
      if (chart.containPixel && !chart.containPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [x, y])) {
        return;
      }
    } catch (error) {
      console.warn('containPixel 检测失败:', error);
    }

    let ageValue = null;
    try {
      const axisValue = chart.convertFromPixel
        ? chart.convertFromPixel({ xAxisIndex: 0 }, [x, y])
        : null;
      const parsedValue = Array.isArray(axisValue) ? axisValue[0] : axisValue;
      ageValue = typeof parsedValue === 'string' ? parseFloat(parsedValue) : parsedValue;
    } catch (error) {
      console.warn('convertFromPixel 失败:', error);
    }

    let approxIdx = this.pickMeasurementIndexByAge(ageValue);
    if ((approxIdx === null || approxIdx === undefined) && chart) {
      approxIdx = this.findNearestPointByPixel(chart, x, y);
    }
    if (approxIdx === null || approxIdx === undefined) {
      return;
    }

    const targetPoint = this.childHeightData[approxIdx];
    if (!targetPoint || typeof targetPoint.value !== 'number') {
      return;
    }

    const selectedPoint = {
      ageLabel: QUARTER_AGES[approxIdx] ? `${QUARTER_AGES[approxIdx].toFixed(2)}岁` : '',
      dateLabel: targetPoint.dateLabel || '',
      height: targetPoint.value.toFixed(1),
      weight: typeof targetPoint.weight === 'number' && !isNaN(targetPoint.weight)
        ? targetPoint.weight.toFixed(1)
        : null
    };

    this.setData({ selectedPoint });
  },

  pickMeasurementIndexByAge(ageValue) {
    if (typeof ageValue !== 'number' || isNaN(ageValue)) {
      return this.findNearestMeasurementIndex(null);
    }

    let closestIdx = -1;
    let minDiff = Number.MAX_VALUE;
    QUARTER_AGES.forEach((age, idx) => {
      const diff = Math.abs(age - ageValue);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });

    return this.findNearestMeasurementIndex(closestIdx);
  },

  findNearestMeasurementIndex(baseIdx) {
    if (!Array.isArray(this.childHeightData) || this.childHeightData.length === 0) {
      return null;
    }

    if (baseIdx === null || baseIdx === undefined || baseIdx < 0 || baseIdx >= QUARTER_AGES.length) {
      // 找到第一个有数据的点
      const firstIdx = this.childHeightData.findIndex(item => item && typeof item.value === 'number');
      return firstIdx >= 0 ? firstIdx : null;
    }

    if (this.childHeightData[baseIdx] && typeof this.childHeightData[baseIdx].value === 'number') {
      return baseIdx;
    }

    let offset = 1;
    while (baseIdx - offset >= 0 || baseIdx + offset < this.childHeightData.length) {
      const leftIdx = baseIdx - offset;
      const rightIdx = baseIdx + offset;
      if (leftIdx >= 0) {
        const left = this.childHeightData[leftIdx];
        if (left && typeof left.value === 'number') {
          return leftIdx;
        }
      }
      if (rightIdx < this.childHeightData.length) {
        const right = this.childHeightData[rightIdx];
        if (right && typeof right.value === 'number') {
          return rightIdx;
        }
      }
      offset++;
    }

    return null;
  },

  findNearestPointByPixel(chart, x, y) {
    if (!chart || !Array.isArray(this.childHeightData)) {
      return null;
    }
    let closestIdx = null;
    let minDistance = Number.MAX_VALUE;
    this.childHeightData.forEach((point, idx) => {
      if (!point || typeof point.value !== 'number' || typeof QUARTER_AGES[idx] !== 'number') {
        return;
      }
      try {
        const pixelX = chart.convertToPixel({ xAxisIndex: 0 }, QUARTER_AGES[idx]);
        const pixelY = chart.convertToPixel({ yAxisIndex: 0 }, point.value);
        if (typeof pixelX !== 'number' || typeof pixelY !== 'number') {
          return;
        }
        const dx = pixelX - x;
        const dy = pixelY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = idx;
        }
      } catch (error) {
        console.warn('convertToPixel 失败:', error);
      }
    });

    return minDistance <= 40 ? closestIdx : null;
  },

  onUnload() {
    if (this.chart && this.chartClickHandler) {
      this.chart.off('click', this.chartClickHandler);
      this.chartClickHandler = null;
    }
  },

  buildHeightChartOption(chartData) {
    // X轴数据：0.5岁间隔的年龄点
    const LAST_INDEX = QUARTER_AGES.length - 1;
    const xAxisData = QUARTER_AGES.map(age => age.toFixed(2));
    
    // 构建标准百分位曲线数据
    const percentileSeries = PERCENTILE_ORDER.map(p => ({
      name: `${p}百分位`,
      type: 'line',
      data: HEIGHT_PERCENTILES[p] || [],
      smooth: true,
      lineStyle: {
        width: 2,
        color: PERCENTILE_COLORS[p] || '#cccccc'
      },
      symbol: 'none',
      showSymbol: false
    }));

    // 构建儿童身高数据（匹配到最近的季度点）
    const childHeightData = new Array(QUARTER_AGES.length).fill(null);
    const birthStr = this.data.child.birth_time || this.data.child.birthdate;
    const birthDate = birthStr ? new Date(birthStr) : null;

    (chartData.measurements || []).forEach((measurement) => {
      let ageInYears = null;

      if (typeof measurement.ageInYears === 'number' && !isNaN(measurement.ageInYears)) {
        ageInYears = measurement.ageInYears;
      } else if (birthDate && measurement.rawDate) {
        const recordDate = new Date(measurement.rawDate);
        ageInYears = this.calculateAgeInYearsFromDates(birthDate, recordDate);
      }

      if (ageInYears === null || isNaN(ageInYears) || ageInYears < 2 || ageInYears > 18) {
        return;
      }

      // 找到距离当前年龄最近的季度点
      let closestIdx = 0;
      let minDiff = Math.abs(ageInYears - QUARTER_AGES[0]);
      QUARTER_AGES.forEach((age, idx) => {
        const diff = Math.abs(ageInYears - age);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = idx;
        }
      });

      const heightVal = measurement.height !== undefined ? parseFloat(measurement.height) : null;
      if (!isNaN(heightVal)) {
        const normalizedHeight = parseFloat(heightVal.toFixed(1));
        childHeightData[closestIdx] = {
          value: normalizedHeight,
          dateLabel: measurement.dateLabel,
          rawDate: measurement.rawDate,
          weight: typeof measurement.weight === 'number' && !isNaN(measurement.weight)
            ? parseFloat(measurement.weight.toFixed(1))
            : null
        };
      }
    });

    // 构建完整的系列数据
    const series = [
      ...percentileSeries,
      {
        name: `${chartData.name || '儿童'}身高`,
        type: 'line',
        data: childHeightData,
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
        trigger: 'axis',
        triggerOn: 'mousemove|click|touchstart|touchmove',
        alwaysShowContent: true,
        confine: true,
        enterable: true,
        axisPointer: {
          type: 'line',
          snap: true
        },
        backgroundColor: 'rgba(50, 50, 50, 0.85)',
        borderWidth: 0,
        padding: [8, 12],
        renderMode: 'richText',
        formatter: function (params) {
          let result = '';
          if (params && params.length > 0) {
            const ageIndex = params[0].dataIndex;
            const ageLabel = QUARTER_AGES[ageIndex] ? `${QUARTER_AGES[ageIndex].toFixed(2)}岁` : '';
            result = ageLabel + '\n';
            params.forEach(param => {
              if (param.value === null || param.value === undefined) {
                return;
              }
              const dataValue = (param.data && typeof param.data === 'object' && typeof param.data.value === 'number')
                ? param.data.value
                : (typeof param.value === 'number' ? param.value : null);
              if (dataValue === null || dataValue === undefined || isNaN(dataValue)) {
                return;
              }
              if (param.seriesName.indexOf('身高') > -1 && param.data && typeof param.data === 'object') {
                const dateLabel = param.data.dateLabel ? `测量日期：${param.data.dateLabel}` : '';
                const hasWeight = typeof param.data.weight === 'number' && !isNaN(param.data.weight);
                const weightLabel = hasWeight ? `体重：${param.data.weight.toFixed(1)}kg` : '';
                result += `${param.seriesName}: ${dataValue.toFixed(1)}cm\n`;
                if (dateLabel) {
                  result += `${dateLabel}\n`;
                }
                if (weightLabel) {
                  result += `${weightLabel}\n`;
                }
              } else {
                result += `${param.seriesName}: ${dataValue.toFixed(1)}cm\n`;
              }
            });
          }
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
        name: '身高(cm)',
        min: 80,
        max: 190,
        splitNumber: 11,
        axisLabel: {
          formatter: '{value}cm'
        }
      },
      series: series
    };
  },

  formatMeasurementDate(dateObj) {
    if (!(dateObj instanceof Date) || isNaN(dateObj)) {
      return '';
    }
    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  calculateAgeInYearsFromDates(birthDate, targetDate) {
    if (!(birthDate instanceof Date) || isNaN(birthDate) || !(targetDate instanceof Date) || isNaN(targetDate)) {
      return null;
    }
    let diffMs = targetDate.getTime() - birthDate.getTime();
    if (diffMs < 0) diffMs = 0;
    const years = diffMs / (365.25 * 24 * 60 * 60 * 1000);
    return parseFloat(years.toFixed(2));
  }
});
