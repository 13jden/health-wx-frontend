const { request } = require("../../utils/request");
const childApi = require("../../api/child");
const growthApi = require("../../api/growth");
import uCharts from '../../js_sdk/u-charts/u-charts.js';
const { STANDARD_HEIGHT_DATA, getStandardHeightByAge } = require("../../utils/standardGrowthData");
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
  touchState: null, // 触摸状态，用于区分拖动和缩放
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
      console.log('Height页面从storage获取childId:', childId);
    } else {
      childId = app.globalData.nowChildId;
      console.log('Height页面从全局数据获取childId:', childId);
    }
    
    this.setData({ childId: childId });
    this.fetchChildInfo();
    this.fetchGrowthRecords();
  },



  fetchChildInfo() {
    const userType = app.globalData.userType || "parent"; // 默认家长端
    console.log('Height页面开始获取儿童信息，childId:', this.data.childId);
    
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
          console.log('Height页面child.height:', child.height);
          console.log('Height页面child.weight:', child.weight);
          console.log('Height页面child.birth_time:', child.birth_time);
          
          this.setData({ 
            child: child, 
            age: this.calculateAge(child.birth_time) 
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
          
          // 延迟绘制图表，确保数据已设置（即使没有数据也显示标准曲线）
          setTimeout(() => {
            this.getServerData(chartData);
          }, 100);
        } else {
          // 即使获取失败，也要显示标准曲线
          const chartData = { x_data: [], chirld_height: [], chirld_weight: [], name: this.data.child.name || '儿童' };
          this.setData({ pltData: chartData });
          setTimeout(() => {
            this.getServerData(chartData);
          }, 100);
        }
      }).catch(error => {
        console.error('Height页面fetchGrowthRecords获取生长记录失败:', error);
        // 即使获取失败，也要显示标准曲线
        const chartData = { x_data: [], chirld_height: [], chirld_weight: [], name: this.data.child.name || '儿童' };
        this.setData({ pltData: chartData });
        setTimeout(() => {
          this.getServerData(chartData);
        }, 100);
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
          
          // 延迟绘制图表，确保数据已设置（即使没有数据也显示标准曲线）
          setTimeout(() => {
            this.getServerData(chartData);
          }, 100);
        } else {
          // 即使获取失败，也要显示标准曲线
          const chartData = { x_data: [], chirld_height: [], chirld_weight: [], name: this.data.child.name || '儿童' };
          this.setData({ pltData: chartData });
          setTimeout(() => {
            this.getServerData(chartData);
          }, 100);
        }
      }).catch(error => {
        console.error('Height页面fetchGrowthRecords获取生长记录失败:', error);
        // 即使获取失败，也要显示标准曲线
        const chartData = { x_data: [], chirld_height: [], chirld_weight: [], name: this.data.child.name || '儿童' };
        this.setData({ pltData: chartData });
        setTimeout(() => {
          this.getServerData(chartData);
        }, 100);
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
    console.log('records类型:', typeof records);
    console.log('records是否为数组:', Array.isArray(records));
    
    // 处理API返回的数据结构
    let recordsArray = [];
    if (records && typeof records === 'object') {
      // 如果records有data字段，说明是API返回的完整响应
      if (records.data && Array.isArray(records.data)) {
        recordsArray = records.data;
        console.log('从API响应的data字段提取数据:', recordsArray);
      }
      // 如果records本身就是数组
      else if (Array.isArray(records)) {
        recordsArray = records;
        console.log('records本身就是数组:', recordsArray);
      }
    }
    
    console.log('处理后的数组:', recordsArray);
    console.log('数组长度:', recordsArray.length);
    
    if (!recordsArray || recordsArray.length === 0) {
      console.log('没有生长记录数据');
      return {
        x_data: [],
        chirld_height: [],
        chirld_weight: [],
        name: this.data.child.name || '儿童'
      };
    }

    // 打印第一条记录的字段，帮助调试
    if (recordsArray.length > 0) {
      console.log('第一条记录的字段:', Object.keys(recordsArray[0]));
      console.log('第一条记录的完整数据:', recordsArray[0]);
    }

    // 按测试时间排序
    const sortedRecords = recordsArray.sort((a, b) => {
      // 尝试多个可能的日期字段
      const dateA = new Date(a.testDate || a.test_date || a.createTime || a.create_time || a.created_at || a.updated_at);
      const dateB = new Date(b.testDate || b.test_date || b.createTime || b.create_time || b.created_at || b.updated_at);
      return dateA - dateB;
    });
    
    console.log('按时间排序后的记录:', sortedRecords);
    
    // 提取测试时间作为X轴数据
    const x_data = sortedRecords.map((record, index) => {
      const testDate = record.testDate || record.test_date || record.createTime || record.create_time || record.created_at || record.updated_at;
      console.log(`记录${index}的日期字段:`, {
        testDate: record.testDate,
        test_date: record.test_date,
        createTime: record.createTime,
        create_time: record.create_time,
        created_at: record.created_at,
        updated_at: record.updated_at
      });
      
      if (testDate) {
        // 格式化日期为 YYYY-MM-DD 格式
        const date = new Date(testDate);
        const formatted = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        console.log(`记录${index}格式化后的日期:`, formatted);
        return formatted;
      }
      // 如果没有日期字段，使用序号
      console.log(`记录${index}没有日期字段，使用序号:`, `记录${index + 1}`);
      return `记录${index + 1}`;
    });

    const chirld_height = sortedRecords.map(record => record.height);
    const chirld_weight = sortedRecords.map(record => record.weight);
    
    console.log('提取的X轴数据(测试时间):', x_data);
    console.log('提取的身高数据:', chirld_height);
    console.log('提取的体重数据:', chirld_weight);

    return {
      x_data,
      chirld_height,
      chirld_weight,
      name: this.data.child.name || '儿童'
    };
  },

  getServerData(pltData) {
    console.log('开始绘制身高图表，使用标准数据');
    
    // 直接使用预计算的标准数据
    const standardData = STANDARD_HEIGHT_DATA;
    
    // 生成0-216个月的完整X轴数据
    const allMonths = [];
    const monthLabels = [];
    for (let month = 0; month <= 216; month += 1) {
      allMonths.push(month);
      // 简化标签格式：每3个月显示一个标签
      if (month % 3 === 0 || month === 0 || month === 216) {
        if (month < 12) {
          monthLabels.push(`${month}月`);
        } else {
          const years = month / 12;
          if (years % 1 === 0) {
            monthLabels.push(`${years}岁`);
          } else {
            monthLabels.push(`${years.toFixed(1)}岁`);
          }
        }
      } else {
        monthLabels.push('');
      }
    }
    
    // 从标准数据中提取7条曲线
    const m3sdData = allMonths.map(month => standardData[month].m3sd);
    const m2sdData = allMonths.map(month => standardData[month].m2sd);
    const m1sdData = allMonths.map(month => standardData[month].m1sd);
    const medianData = allMonths.map(month => standardData[month].median);
    const p1sdData = allMonths.map(month => standardData[month].p1sd);
    const p2sdData = allMonths.map(month => standardData[month].p2sd);
    const p3sdData = allMonths.map(month => standardData[month].p3sd);
    
    // 处理用户真实身高数据（如果有的话）
    // 初始化用户身高数据数组，全部为null（不显示数据点）
    let childHeightData = allMonths.map(() => null);
    
    if (pltData.x_data && pltData.x_data.length > 0 && pltData.chirld_height && pltData.chirld_height.length > 0) {
      // 计算儿童的出生日期
      const birthDate = new Date(this.data.child.birth_time);
      
      // 为每个用户记录计算对应的月龄，并映射到最近的X轴位置
      pltData.x_data.forEach((dateStr, index) => {
        const recordDate = new Date(dateStr);
        const ageInMonths = (recordDate.getFullYear() - birthDate.getFullYear()) * 12 + (recordDate.getMonth() - birthDate.getMonth());
        
        // 找到最接近的X轴位置（allMonths数组中的索引）
        let closestIndex = 0;
        let minDiff = Math.abs(allMonths[0] - ageInMonths);
        for (let i = 1; i < allMonths.length; i++) {
          const diff = Math.abs(allMonths[i] - ageInMonths);
          if (diff < minDiff) {
            minDiff = diff;
            closestIndex = i;
          }
        }
        
        // 如果月龄在合理范围内（0-216个月），则设置对应的身高值
        if (ageInMonths >= 0 && ageInMonths <= 216) {
          const height = parseFloat(pltData.chirld_height[index]);
          if (!isNaN(height)) {
            childHeightData[closestIndex] = parseFloat(height.toFixed(1));
            console.log(`用户数据：月龄${ageInMonths}月，身高${height}cm，映射到X轴位置${allMonths[closestIndex]}月`);
          }
        }
      });
    }
    
    // 构建图表数据，包括所有7条标准SD曲线和1条真实身高曲线，共8条
    let res_height = {
      categories: monthLabels, // 使用固定0-18岁的月份标签
      series: [
        {
          name: "-3SD",
          color: "#E8F4FD", // 浅蓝色
          data: m3sdData
        },
        {
          name: "-2SD",
          color: "#C5E3F9", // 浅蓝色
          data: m2sdData
        },
        {
          name: "-1SD",
          color: "#9DD0F5", // 浅蓝色
          data: m1sdData
        },
        {
          name: "中位数",
          color: "#5BA8E8", // 蓝色
          data: medianData
        },
        {
          name: "+1SD",
          color: "#9DD0F5", // 浅蓝色
          data: p1sdData
        },
        {
          name: "+2SD",
          color: "#C5E3F9", // 浅蓝色
          data: p2sdData
        },
        {
          name: "+3SD",
          color: "#E8F4FD", // 浅蓝色
          data: p3sdData
        },
        {
          name: "儿童身高",
          color: "#FF6B6B", // 红色
          data: childHeightData,
          pointShape: "circle",
          pointSize: 6
        }
      ]
    };
    
    console.log('身高图表数据准备完成:', res_height);
    return res_height;
  },

  parseAgeToMonths(ageStr) {
    if (ageStr === '出生') return 0;
    if (ageStr.includes('岁')) {
      const parts = ageStr.split('岁');
      const years = parseInt(parts[0]) || 0;
      let months = 0;
      if (parts[1]) {
        const monthMatch = parts[1].match(/(\d+)月/);
        if (monthMatch) {
          months = parseInt(monthMatch[1]);
        } else if (parts[1].includes('.')) {
          // 处理如 "2.5岁" 的情况
          const decimal = parseFloat(parts[1]);
          months = Math.round(decimal * 12);
        }
      }
      return years * 12 + months;
    }
    if (ageStr.includes('月')) {
      return parseInt(ageStr) || 0;
    }
    return 0;
  },

  generateStandardHeightDataFromPoints() {
    // 完整的数据点（从出生到18岁）
    const rawData = [
      { age: '出生', m3sd: 44.7, m2sd: 46.4, m1sd: 48.0, median: 49.7, p1sd: 51.4, p2sd: 53.2, p3sd: 55.0 },
      { age: '1月', m3sd: 47.9, m2sd: 49.8, m1sd: 51.7, median: 53.6, p1sd: 55.5, p2sd: 57.5, p3sd: 59.6 },
      { age: '2月', m3sd: 51.1, m2sd: 53.2, m1sd: 55.3, median: 57.4, p1sd: 59.6, p2sd: 61.8, p3sd: 64.1 },
      { age: '3月', m3sd: 53.9, m2sd: 56.0, m1sd: 58.2, median: 60.3, p1sd: 62.5, p2sd: 64.8, p3sd: 67.1 },
      { age: '4月', m3sd: 56.7, m2sd: 58.8, m1sd: 61.0, median: 63.1, p1sd: 65.4, p2sd: 67.7, p3sd: 70.0 },
      { age: '5月', m3sd: 58.4, m2sd: 60.6, m1sd: 62.8, median: 65.0, p1sd: 67.3, p2sd: 69.6, p3sd: 72.0 },
      { age: '6月', m3sd: 60.1, m2sd: 62.3, m1sd: 64.5, median: 66.8, p1sd: 69.1, p2sd: 71.5, p3sd: 74.0 },
      { age: '7月', m3sd: 61.3, m2sd: 63.6, m1sd: 65.8, median: 68.2, p1sd: 70.6, p2sd: 73.1, p3sd: 75.6 },
      { age: '8月', m3sd: 62.5, m2sd: 64.8, m1sd: 67.2, median: 69.6, p1sd: 72.1, p2sd: 74.6, p3sd: 77.3 },
      { age: '9月', m3sd: 63.7, m2sd: 66.1, m1sd: 68.5, median: 71.0, p1sd: 73.6, p2sd: 76.2, p3sd: 78.9 },
      { age: '10月', m3sd: 64.9, m2sd: 67.3, m1sd: 69.8, median: 72.3, p1sd: 75.0, p2sd: 77.6, p3sd: 80.4 },
      { age: '11月', m3sd: 66.0, m2sd: 68.5, m1sd: 71.0, median: 73.7, p1sd: 76.3, p2sd: 79.1, p3sd: 81.9 },
      { age: '12月', m3sd: 67.2, m2sd: 69.7, m1sd: 72.3, median: 75.0, p1sd: 77.7, p2sd: 80.5, p3sd: 83.4 },
      { age: '13月', m3sd: 68.2, m2sd: 70.8, m1sd: 73.4, median: 76.2, p1sd: 78.9, p2sd: 81.8, p3sd: 84.7 },
      { age: '14月', m3sd: 69.2, m2sd: 71.8, m1sd: 74.5, median: 77.3, p1sd: 80.2, p2sd: 83.0, p3sd: 86.1 },
      { age: '15月', m3sd: 70.2, m2sd: 72.9, m1sd: 75.6, median: 78.5, p1sd: 81.4, p2sd: 84.3, p3sd: 87.4 },
      { age: '16月', m3sd: 71.1, m2sd: 73.8, m1sd: 76.6, median: 79.5, p1sd: 82.5, p2sd: 85.4, p3sd: 88.6 },
      { age: '17月', m3sd: 71.9, m2sd: 74.7, m1sd: 77.5, median: 80.5, p1sd: 83.5, p2sd: 86.6, p3sd: 89.8 },
      { age: '18月', m3sd: 72.8, m2sd: 75.6, m1sd: 78.5, median: 81.5, p1sd: 84.6, p2sd: 87.7, p3sd: 91.0 },
      { age: '19月', m3sd: 73.6, m2sd: 76.4, m1sd: 79.4, median: 82.5, p1sd: 85.6, p2sd: 88.8, p3sd: 92.2 },
      { age: '20月', m3sd: 74.3, m2sd: 77.3, m1sd: 80.3, median: 83.4, p1sd: 86.7, p2sd: 90.0, p3sd: 93.3 },
      { age: '21月', m3sd: 75.1, m2sd: 78.1, m1sd: 81.2, median: 84.4, p1sd: 87.7, p2sd: 91.1, p3sd: 94.5 },
      { age: '22月', m3sd: 75.8, m2sd: 78.9, m1sd: 82.1, median: 85.3, p1sd: 88.7, p2sd: 92.2, p3sd: 95.7 },
      { age: '23月', m3sd: 76.6, m2sd: 79.7, m1sd: 82.9, median: 86.3, p1sd: 89.7, p2sd: 93.2, p3sd: 96.8 },
      { age: '2岁', m3sd: 77.3, m2sd: 80.5, m1sd: 83.8, median: 87.2, p1sd: 90.7, p2sd: 94.3, p3sd: 98.0 },
      { age: '2岁1月', m3sd: 78.0, m2sd: 81.2, m1sd: 84.6, median: 88.0, p1sd: 91.6, p2sd: 95.2, p3sd: 99.0 },
      { age: '2岁2月', m3sd: 78.7, m2sd: 81.9, m1sd: 85.3, median: 88.8, p1sd: 92.4, p2sd: 96.1, p3sd: 99.9 },
      { age: '2岁3月', m3sd: 79.4, m2sd: 82.7, m1sd: 86.1, median: 89.7, p1sd: 93.3, p2sd: 97.1, p3sd: 100.9 },
      { age: '2岁4月', m3sd: 80.0, m2sd: 83.4, m1sd: 86.9, median: 90.5, p1sd: 94.2, p2sd: 98.0, p3sd: 101.9 },
      { age: '2岁5月', m3sd: 80.7, m2sd: 84.1, m1sd: 87.6, median: 91.3, p1sd: 95.0, p2sd: 98.9, p3sd: 102.8 },
      { age: '2.5岁', m3sd: 81.4, m2sd: 84.8, m1sd: 88.4, median: 92.1, p1sd: 95.9, p2sd: 99.8, p3sd: 103.8 },
      { age: '2岁7月', m3sd: 82.0, m2sd: 85.4, m1sd: 89.0, median: 92.7, p1sd: 96.5, p2sd: 100.4, p3sd: 104.4 },
      { age: '2岁8月', m3sd: 82.5, m2sd: 85.9, m1sd: 89.5, median: 93.3, p1sd: 97.1, p2sd: 101.0, p3sd: 105.0 },
      { age: '2岁9月', m3sd: 83.1, m2sd: 86.5, m1sd: 90.1, median: 93.9, p1sd: 97.7, p2sd: 101.6, p3sd: 105.6 },
      { age: '2岁10月', m3sd: 83.6, m2sd: 87.1, m1sd: 90.7, median: 94.4, p1sd: 98.2, p2sd: 102.2, p3sd: 106.2 },
      { age: '2岁11月', m3sd: 84.2, m2sd: 87.6, m1sd: 91.2, median: 95.0, p1sd: 98.8, p2sd: 102.8, p3sd: 106.8 },
      { age: '3岁', m3sd: 84.7, m2sd: 88.2, m1sd: 91.8, median: 95.6, p1sd: 99.4, p2sd: 103.4, p3sd: 107.4 },
      { age: '3岁1月', m3sd: 85.3, m2sd: 88.8, m1sd: 92.4, median: 96.2, p1sd: 100.1, p2sd: 104.0, p3sd: 108.1 },
      { age: '3岁2月', m3sd: 85.9, m2sd: 89.4, m1sd: 93.1, median: 96.9, p1sd: 100.7, p2sd: 104.7, p3sd: 108.7 },
      { age: '3岁3月', m3sd: 86.6, m2sd: 90.1, m1sd: 93.7, median: 97.5, p1sd: 101.4, p2sd: 105.3, p3sd: 109.4 },
      { age: '3岁4月', m3sd: 87.2, m2sd: 90.7, m1sd: 94.3, median: 98.1, p1sd: 102.0, p2sd: 105.9, p3sd: 110.0 },
      { age: '3岁5月', m3sd: 87.8, m2sd: 91.3, m1sd: 95.0, median: 98.8, p1sd: 102.7, p2sd: 106.6, p3sd: 110.7 },
      { age: '3.5岁', m3sd: 88.4, m2sd: 91.9, m1sd: 95.6, median: 99.4, p1sd: 103.3, p2sd: 107.2, p3sd: 111.3 },
      { age: '3岁7月', m3sd: 89.0, m2sd: 92.5, m1sd: 96.2, median: 100.0, p1sd: 103.9, p2sd: 107.9, p3sd: 112.0 },
      { age: '3岁8月', m3sd: 89.5, m2sd: 93.1, m1sd: 96.8, median: 100.6, p1sd: 104.5, p2sd: 108.5, p3sd: 112.6 },
      { age: '3岁9月', m3sd: 90.1, m2sd: 93.7, m1sd: 97.4, median: 101.3, p1sd: 105.2, p2sd: 109.2, p3sd: 113.3 },
      { age: '3岁10月', m3sd: 90.6, m2sd: 94.2, m1sd: 98.0, median: 101.9, p1sd: 105.8, p2sd: 109.8, p3sd: 114.0 },
      { age: '3岁11月', m3sd: 91.2, m2sd: 94.8, m1sd: 98.6, median: 102.5, p1sd: 106.4, p2sd: 110.5, p3sd: 114.6 },
      { age: '4岁', m3sd: 91.7, m2sd: 95.4, m1sd: 99.2, median: 103.1, p1sd: 107.0, p2sd: 111.1, p3sd: 115.3 },
      { age: '4岁1月', m3sd: 92.2, m2sd: 96.0, m1sd: 99.8, median: 103.7, p1sd: 107.7, p2sd: 111.8, p3sd: 116.0 },
      { age: '4岁2月', m3sd: 92.7, m2sd: 96.5, m1sd: 100.4, median: 104.3, p1sd: 108.3, p2sd: 112.5, p3sd: 116.7 },
      { age: '4岁3月', m3sd: 93.3, m2sd: 97.1, m1sd: 101.0, median: 104.9, p1sd: 109.0, p2sd: 113.2, p3sd: 117.4 },
      { age: '4岁4月', m3sd: 93.8, m2sd: 97.6, m1sd: 101.5, median: 105.5, p1sd: 109.6, p2sd: 113.8, p3sd: 118.1 },
      { age: '4岁5月', m3sd: 94.3, m2sd: 98.2, m1sd: 102.1, median: 106.1, p1sd: 110.3, p2sd: 114.5, p3sd: 118.8 },
      { age: '4.5岁', m3sd: 94.8, m2sd: 98.7, m1sd: 102.7, median: 106.7, p1sd: 110.9, p2sd: 115.2, p3sd: 119.5 },
      { age: '4岁7月', m3sd: 95.3, m2sd: 99.2, m1sd: 103.3, median: 107.3, p1sd: 111.5, p2sd: 115.8, p3sd: 120.2 },
      { age: '4岁8月', m3sd: 95.8, m2sd: 99.7, m1sd: 103.8, median: 107.9, p1sd: 112.1, p2sd: 116.4, p3sd: 120.8 },
      { age: '4岁9月', m3sd: 96.3, m2sd: 100.3, m1sd: 104.4, median: 108.5, p1sd: 112.7, p2sd: 117.1, p3sd: 121.5 },
      { age: '4岁10月', m3sd: 96.8, m2sd: 100.8, m1sd: 104.9, median: 109.0, p1sd: 113.3, p2sd: 117.7, p3sd: 122.1 },
      { age: '4岁11月', m3sd: 97.3, m2sd: 101.3, m1sd: 105.5, median: 109.6, p1sd: 113.9, p2sd: 118.3, p3sd: 122.8 },
      { age: '5岁', m3sd: 97.8, m2sd: 101.8, m1sd: 106.0, median: 110.2, p1sd: 114.5, p2sd: 118.9, p3sd: 123.4 },
      { age: '5岁1月', m3sd: 98.3, m2sd: 102.3, m1sd: 106.5, median: 110.8, p1sd: 115.1, p2sd: 119.5, p3sd: 124.0 },
      { age: '5岁2月', m3sd: 98.8, m2sd: 102.8, m1sd: 107.1, median: 111.3, p1sd: 115.7, p2sd: 120.1, p3sd: 124.7 },
      { age: '5岁3月', m3sd: 99.3, m2sd: 103.4, m1sd: 107.6, median: 111.9, p1sd: 116.3, p2sd: 120.8, p3sd: 125.3 },
      { age: '5岁4月', m3sd: 99.7, m2sd: 103.9, m1sd: 108.1, median: 112.4, p1sd: 116.8, p2sd: 121.4, p3sd: 125.9 },
      { age: '5岁5月', m3sd: 100.2, m2sd: 104.4, m1sd: 108.7, median: 113.0, p1sd: 117.4, p2sd: 122.0, p3sd: 126.6 },
      { age: '5.5岁', m3sd: 100.7, m2sd: 104.9, m1sd: 109.2, median: 113.5, p1sd: 118.0, p2sd: 122.6, p3sd: 127.2 },
      { age: '5岁7月', m3sd: 101.1, m2sd: 105.4, m1sd: 109.7, median: 114.0, p1sd: 118.5, p2sd: 123.2, p3sd: 127.8 },
      { age: '5岁8月', m3sd: 101.5, m2sd: 105.8, m1sd: 110.1, median: 114.5, p1sd: 119.1, p2sd: 123.7, p3sd: 128.4 },
      { age: '5岁9月', m3sd: 102.0, m2sd: 106.3, m1sd: 110.6, median: 115.1, p1sd: 119.6, p2sd: 124.3, p3sd: 129.0 },
      { age: '5岁10月', m3sd: 102.4, m2sd: 106.7, m1sd: 111.1, median: 115.6, p1sd: 120.1, p2sd: 124.9, p3sd: 129.6 },
      { age: '5岁11月', m3sd: 102.8, m2sd: 107.2, m1sd: 111.5, median: 116.1, p1sd: 120.7, p2sd: 125.4, p3sd: 130.2 },
      { age: '6岁', m3sd: 103.2, m2sd: 107.6, m1sd: 112.0, median: 116.6, p1sd: 121.2, p2sd: 126.0, p3sd: 130.8 },
      { age: '6岁1月', m3sd: 103.6, m2sd: 108.0, m1sd: 112.5, median: 117.1, p1sd: 121.7, p2sd: 126.5, p3sd: 131.4 },
      { age: '6岁2月', m3sd: 104.0, m2sd: 108.4, m1sd: 112.9, median: 117.5, p1sd: 122.2, p2sd: 127.1, p3sd: 131.9 },
      { age: '6岁3月', m3sd: 104.4, m2sd: 108.9, m1sd: 113.4, median: 118.0, p1sd: 122.8, p2sd: 127.6, p3sd: 132.5 },
      { age: '6岁4月', m3sd: 104.7, m2sd: 109.3, m1sd: 113.8, median: 118.5, p1sd: 123.3, p2sd: 128.1, p3sd: 133.1 },
      { age: '6岁5月', m3sd: 105.1, m2sd: 109.7, m1sd: 114.3, median: 118.9, p1sd: 123.8, p2sd: 128.7, p3sd: 133.6 },
      { age: '6.5岁', m3sd: 105.5, m2sd: 110.1, m1sd: 114.7, median: 119.4, p1sd: 124.3, p2sd: 129.2, p3sd: 134.2 },
      { age: '6岁7月', m3sd: 105.9, m2sd: 110.5, m1sd: 115.2, median: 119.9, p1sd: 124.9, p2sd: 129.8, p3sd: 134.8 },
      { age: '6岁8月', m3sd: 106.3, m2sd: 111.0, m1sd: 115.7, median: 120.4, p1sd: 125.4, p2sd: 130.4, p3sd: 135.4 },
      { age: '6岁9月', m3sd: 106.8, m2sd: 111.4, m1sd: 116.2, median: 121.0, p1sd: 126.0, p2sd: 131.0, p3sd: 136.1 },
      { age: '6岁10月', m3sd: 107.2, m2sd: 111.8, m1sd: 116.6, median: 121.5, p1sd: 126.5, p2sd: 131.5, p3sd: 136.7 },
      { age: '6岁11月', m3sd: 107.6, m2sd: 112.3, m1sd: 117.1, median: 122.0, p1sd: 127.1, p2sd: 132.1, p3sd: 137.3 },
      { age: '7岁', m3sd: 108.0, m2sd: 112.7, m1sd: 117.6, median: 122.5, p1sd: 127.6, p2sd: 132.7, p3sd: 137.9 },
      { age: '7岁1月', m3sd: 108.4, m2sd: 113.2, m1sd: 118.1, median: 123.0, p1sd: 128.1, p2sd: 133.3, p3sd: 138.5 },
      { age: '7岁2月', m3sd: 108.8, m2sd: 113.6, m1sd: 118.5, median: 123.5, p1sd: 128.7, p2sd: 133.8, p3sd: 139.1 },
      { age: '7岁3月', m3sd: 109.2, m2sd: 114.1, m1sd: 119.0, median: 124.1, p1sd: 129.2, p2sd: 134.4, p3sd: 139.7 },
      { age: '7岁4月', m3sd: 109.6, m2sd: 114.5, m1sd: 119.5, median: 124.6, p1sd: 129.7, p2sd: 135.0, p3sd: 140.3 },
      { age: '7岁5月', m3sd: 110.0, m2sd: 115.0, m1sd: 119.9, median: 125.1, p1sd: 130.3, p2sd: 135.5, p3sd: 140.9 },
      { age: '7.5岁', m3sd: 110.4, m2sd: 115.4, m1sd: 120.4, median: 125.6, p1sd: 130.8, p2sd: 136.1, p3sd: 141.5 },
      { age: '7岁7月', m3sd: 110.8, m2sd: 115.8, m1sd: 120.9, median: 126.1, p1sd: 131.3, p2sd: 136.7, p3sd: 142.1 },
      { age: '7岁8月', m3sd: 111.2, m2sd: 116.2, m1sd: 121.3, median: 126.6, p1sd: 131.8, p2sd: 137.2, p3sd: 142.6 },
      { age: '7岁9月', m3sd: 111.6, m2sd: 116.7, m1sd: 121.8, median: 127.1, p1sd: 132.4, p2sd: 137.8, p3sd: 143.2 },
      { age: '7岁10月', m3sd: 111.9, m2sd: 117.1, m1sd: 122.2, median: 127.5, p1sd: 132.9, p2sd: 138.3, p3sd: 143.8 },
      { age: '7岁11月', m3sd: 112.3, m2sd: 117.5, m1sd: 122.7, median: 128.0, p1sd: 133.4, p2sd: 138.9, p3sd: 144.3 },
      { age: '8岁', m3sd: 112.7, m2sd: 117.9, m1sd: 123.1, median: 128.5, p1sd: 133.9, p2sd: 139.4, p3sd: 144.9 },
      { age: '8岁1月', m3sd: 113.1, m2sd: 118.3, m1sd: 123.6, median: 129.0, p1sd: 134.4, p2sd: 139.9, p3sd: 145.5 },
      { age: '8岁2月', m3sd: 113.5, m2sd: 118.7, m1sd: 124.0, median: 129.4, p1sd: 134.9, p2sd: 140.5, p3sd: 146.1 },
      { age: '8岁3月', m3sd: 113.9, m2sd: 119.1, m1sd: 124.5, median: 129.9, p1sd: 135.4, p2sd: 141.0, p3sd: 146.7 },
      { age: '8岁4月', m3sd: 114.2, m2sd: 119.5, m1sd: 124.9, median: 130.4, p1sd: 135.9, p2sd: 141.5, p3sd: 147.2 },
      { age: '8岁5月', m3sd: 114.6, m2sd: 119.9, m1sd: 125.4, median: 130.8, p1sd: 136.4, p2sd: 142.1, p3sd: 147.8 },
      { age: '8.5岁', m3sd: 115.0, m2sd: 120.3, m1sd: 125.8, median: 131.3, p1sd: 136.9, p2sd: 142.6, p3sd: 148.4 },
      { age: '8岁7月', m3sd: 115.3, m2sd: 120.7, m1sd: 126.2, median: 131.8, p1sd: 137.4, p2sd: 143.1, p3sd: 149.0 },
      { age: '8岁8月', m3sd: 115.7, m2sd: 121.1, m1sd: 126.6, median: 132.2, p1sd: 137.9, p2sd: 143.7, p3sd: 149.5 },
      { age: '8岁9月', m3sd: 116.0, m2sd: 121.5, m1sd: 127.1, median: 132.7, p1sd: 138.4, p2sd: 144.2, p3sd: 150.1 },
      { age: '8岁10月', m3sd: 116.3, m2sd: 121.8, m1sd: 127.5, median: 133.2, p1sd: 138.9, p2sd: 144.7, p3sd: 150.7 },
      { age: '8岁11月', m3sd: 116.7, m2sd: 122.2, m1sd: 127.9, median: 133.6, p1sd: 139.4, p2sd: 145.3, p3sd: 151.2 },
      { age: '9岁', m3sd: 117.0, m2sd: 122.6, m1sd: 128.3, median: 134.1, p1sd: 139.9, p2sd: 145.8, p3sd: 151.8 },
      { age: '9岁1月', m3sd: 117.4, m2sd: 123.0, m1sd: 128.8, median: 134.6, p1sd: 140.4, p2sd: 146.4, p3sd: 152.4 },
      { age: '9岁2月', m3sd: 117.7, m2sd: 123.4, m1sd: 129.2, median: 135.1, p1sd: 141.0, p2sd: 146.9, p3sd: 153.0 },
      { age: '9岁3月', m3sd: 118.1, m2sd: 123.8, m1sd: 129.7, median: 135.6, p1sd: 141.5, p2sd: 147.5, p3sd: 153.6 },
      { age: '9岁4月', m3sd: 118.4, m2sd: 124.2, m1sd: 130.1, median: 136.0, p1sd: 142.0, p2sd: 148.1, p3sd: 154.2 },
      { age: '9岁5月', m3sd: 118.8, m2sd: 124.6, m1sd: 130.6, median: 136.5, p1sd: 142.6, p2sd: 148.6, p3sd: 154.8 },
      { age: '9.5岁', m3sd: 119.1, m2sd: 125.0, m1sd: 131.0, median: 137.0, p1sd: 143.1, p2sd: 149.2, p3sd: 155.4 },
      { age: '9岁7月', m3sd: 119.5, m2sd: 125.4, m1sd: 131.5, median: 137.5, p1sd: 143.7, p2sd: 149.8, p3sd: 156.0 },
      { age: '9岁8月', m3sd: 119.9, m2sd: 125.9, m1sd: 131.9, median: 138.0, p1sd: 144.2, p2sd: 150.4, p3sd: 156.7 },
      { age: '9岁9月', m3sd: 120.3, m2sd: 126.3, m1sd: 132.4, median: 138.6, p1sd: 144.8, p2sd: 151.0, p3sd: 157.3 },
      { age: '9岁10月', m3sd: 120.7, m2sd: 126.7, m1sd: 132.9, median: 139.1, p1sd: 145.3, p2sd: 151.6, p3sd: 157.9 },
      { age: '9岁11月', m3sd: 121.1, m2sd: 127.2, m1sd: 133.3, median: 139.6, p1sd: 145.9, p2sd: 152.2, p3sd: 158.6 },
      { age: '10岁', m3sd: 121.5, m2sd: 127.6, m1sd: 133.8, median: 140.1, p1sd: 146.4, p2sd: 152.8, p3sd: 159.2 },
      { age: '10岁1月', m3sd: 121.9, m2sd: 128.1, m1sd: 134.3, median: 140.6, p1sd: 147.0, p2sd: 153.4, p3sd: 159.8 },
      { age: '10岁2月', m3sd: 122.3, m2sd: 128.5, m1sd: 134.8, median: 141.2, p1sd: 147.5, p2sd: 154.0, p3sd: 160.5 },
      { age: '10岁3月', m3sd: 122.7, m2sd: 129.0, m1sd: 135.3, median: 141.7, p1sd: 148.1, p2sd: 154.6, p3sd: 161.1 },
      { age: '10岁4月', m3sd: 123.1, m2sd: 129.4, m1sd: 135.8, median: 142.2, p1sd: 148.7, p2sd: 155.1, p3sd: 161.7 },
      { age: '10岁5月', m3sd: 123.5, m2sd: 129.9, m1sd: 136.3, median: 142.8, p1sd: 149.2, p2sd: 155.7, p3sd: 162.4 },
      { age: '10.5岁', m3sd: 123.9, m2sd: 130.3, m1sd: 136.8, median: 143.3, p1sd: 149.8, p2sd: 156.3, p3sd: 163.0 },
      { age: '10岁7月', m3sd: 124.4, m2sd: 130.8, m1sd: 137.3, median: 143.9, p1sd: 150.4, p2sd: 156.9, p3sd: 163.6 },
      { age: '10岁8月', m3sd: 124.9, m2sd: 131.3, m1sd: 137.9, median: 144.4, p1sd: 151.0, p2sd: 157.5, p3sd: 164.2 },
      { age: '10岁9月', m3sd: 125.4, m2sd: 131.9, m1sd: 138.4, median: 145.0, p1sd: 151.6, p2sd: 158.2, p3sd: 164.9 },
      { age: '10岁10月', m3sd: 125.9, m2sd: 132.4, m1sd: 138.9, median: 145.5, p1sd: 152.1, p2sd: 158.8, p3sd: 165.5 },
      { age: '10岁11月', m3sd: 126.4, m2sd: 132.9, m1sd: 139.5, median: 146.1, p1sd: 152.7, p2sd: 159.4, p3sd: 166.1 },
      { age: '11岁', m3sd: 126.9, m2sd: 133.4, m1sd: 140.0, median: 146.6, p1sd: 153.3, p2sd: 160.0, p3sd: 166.7 },
      { age: '11岁1月', m3sd: 127.4, m2sd: 133.9, m1sd: 140.5, median: 147.1, p1sd: 153.8, p2sd: 160.5, p3sd: 167.2 },
      { age: '11岁2月', m3sd: 127.9, m2sd: 134.4, m1sd: 141.0, median: 147.6, p1sd: 154.3, p2sd: 161.0, p3sd: 167.7 },
      { age: '11岁3月', m3sd: 128.4, m2sd: 135.0, m1sd: 141.6, median: 148.2, p1sd: 154.8, p2sd: 161.5, p3sd: 168.2 },
      { age: '11岁4月', m3sd: 128.9, m2sd: 135.5, m1sd: 142.1, median: 148.7, p1sd: 155.3, p2sd: 161.9, p3sd: 168.6 },
      { age: '11岁5月', m3sd: 129.4, m2sd: 136.0, m1sd: 142.6, median: 149.2, p1sd: 155.8, p2sd: 162.4, p3sd: 169.1 },
      { age: '11.5岁', m3sd: 129.9, m2sd: 136.5, m1sd: 143.1, median: 149.7, p1sd: 156.3, p2sd: 162.9, p3sd: 169.6 },
      { age: '11岁7月', m3sd: 130.4, m2sd: 137.0, m1sd: 143.6, median: 150.2, p1sd: 156.7, p2sd: 163.3, p3sd: 170.0 },
      { age: '11岁8月', m3sd: 130.9, m2sd: 137.5, m1sd: 144.0, median: 150.6, p1sd: 157.1, p2sd: 163.7, p3sd: 170.3 },
      { age: '11岁9月', m3sd: 131.5, m2sd: 138.0, m1sd: 144.5, median: 151.1, p1sd: 157.6, p2sd: 164.1, p3sd: 170.7 },
      { age: '11岁10月', m3sd: 132.0, m2sd: 138.5, m1sd: 145.0, median: 151.5, p1sd: 158.0, p2sd: 164.5, p3sd: 171.1 },
      { age: '11岁11月', m3sd: 132.5, m2sd: 139.0, m1sd: 145.4, median: 152.0, p1sd: 158.4, p2sd: 164.9, p3sd: 171.4 },
      { age: '12岁', m3sd: 133.0, m2sd: 139.5, m1sd: 145.9, median: 152.4, p1sd: 158.8, p2sd: 165.3, p3sd: 171.8 },
      { age: '12岁1月', m3sd: 133.5, m2sd: 139.9, m1sd: 146.3, median: 152.8, p1sd: 159.1, p2sd: 165.6, p3sd: 172.1 },
      { age: '12岁2月', m3sd: 134.0, m2sd: 140.4, m1sd: 146.7, median: 153.1, p1sd: 159.5, p2sd: 165.9, p3sd: 172.3 },
      { age: '12岁3月', m3sd: 134.5, m2sd: 140.8, m1sd: 147.2, median: 153.5, p1sd: 159.8, p2sd: 166.2, p3sd: 172.6 },
      { age: '12岁4月', m3sd: 134.9, m2sd: 141.2, m1sd: 147.6, median: 153.9, p1sd: 160.1, p2sd: 166.5, p3sd: 172.8 },
      { age: '12岁5月', m3sd: 135.4, m2sd: 141.7, m1sd: 148.0, median: 154.2, p1sd: 160.5, p2sd: 166.8, p3sd: 173.1 },
      { age: '12.5岁', m3sd: 135.9, m2sd: 142.1, m1sd: 148.4, median: 154.6, p1sd: 160.8, p2sd: 167.1, p3sd: 173.3 },
      { age: '12岁7月', m3sd: 136.3, m2sd: 142.5, m1sd: 148.7, median: 154.9, p1sd: 161.1, p2sd: 167.3, p3sd: 173.5 },
      { age: '12岁8月', m3sd: 136.7, m2sd: 142.8, m1sd: 149.0, median: 155.2, p1sd: 161.3, p2sd: 167.5, p3sd: 173.6 },
      { age: '12岁9月', m3sd: 137.1, m2sd: 143.2, m1sd: 149.4, median: 155.5, p1sd: 161.6, p2sd: 167.7, p3sd: 173.8 },
      { age: '12岁10月', m3sd: 137.4, m2sd: 143.5, m1sd: 149.7, median: 155.7, p1sd: 161.8, p2sd: 167.9, p3sd: 174.0 },
      { age: '12岁11月', m3sd: 137.8, m2sd: 143.9, m1sd: 150.0, median: 156.0, p1sd: 162.1, p2sd: 168.1, p3sd: 174.1 },
      { age: '13岁', m3sd: 138.2, m2sd: 144.2, m1sd: 150.3, median: 156.3, p1sd: 162.3, p2sd: 168.3, p3sd: 174.3 },
      { age: '13岁1月', m3sd: 138.5, m2sd: 144.5, m1sd: 150.6, median: 156.5, p1sd: 162.5, p2sd: 168.5, p3sd: 174.4 },
      { age: '13岁2月', m3sd: 138.8, m2sd: 144.8, m1sd: 150.8, median: 156.7, p1sd: 162.7, p2sd: 168.6, p3sd: 174.5 },
      { age: '13岁3月', m3sd: 139.2, m2sd: 145.1, m1sd: 151.1, median: 157.0, p1sd: 162.9, p2sd: 168.8, p3sd: 174.7 },
      { age: '13岁4月', m3sd: 139.5, m2sd: 145.4, m1sd: 151.3, median: 157.2, p1sd: 163.0, p2sd: 168.9, p3sd: 174.8 },
      { age: '13岁5月', m3sd: 139.8, m2sd: 145.7, m1sd: 151.6, median: 157.4, p1sd: 163.2, p2sd: 169.1, p3sd: 174.9 },
      { age: '13.5岁', m3sd: 140.1, m2sd: 146.0, m1sd: 151.8, median: 157.6, p1sd: 163.4, p2sd: 169.2, p3sd: 175.0 },
      { age: '13岁7月', m3sd: 140.3, m2sd: 146.2, m1sd: 152.0, median: 157.8, p1sd: 163.6, p2sd: 169.3, p3sd: 175.1 },
      { age: '13岁8月', m3sd: 140.6, m2sd: 146.4, m1sd: 152.2, median: 157.9, p1sd: 163.7, p2sd: 169.4, p3sd: 175.2 },
      { age: '13岁9月', m3sd: 140.8, m2sd: 146.6, m1sd: 152.4, median: 158.1, p1sd: 163.9, p2sd: 169.6, p3sd: 175.3 },
      { age: '13岁10月', m3sd: 141.0, m2sd: 146.8, m1sd: 152.5, median: 158.3, p1sd: 164.0, p2sd: 169.7, p3sd: 175.3 },
      { age: '13岁11月', m3sd: 141.3, m2sd: 147.0, m1sd: 152.7, median: 158.4, p1sd: 164.2, p2sd: 169.8, p3sd: 175.4 },
      { age: '14岁', m3sd: 141.5, m2sd: 147.2, m1sd: 152.9, median: 158.6, p1sd: 164.3, p2sd: 169.9, p3sd: 175.5 },
      { age: '14岁1月', m3sd: 141.7, m2sd: 147.4, m1sd: 153.1, median: 158.7, p1sd: 164.4, p2sd: 170.0, p3sd: 175.6 },
      { age: '14岁2月', m3sd: 141.9, m2sd: 147.5, m1sd: 153.2, median: 158.9, p1sd: 164.5, p2sd: 170.1, p3sd: 175.6 },
      { age: '14岁3月', m3sd: 142.1, m2sd: 147.7, m1sd: 153.4, median: 159.0, p1sd: 164.6, p2sd: 170.2, p3sd: 175.7 },
      { age: '14岁4月', m3sd: 142.2, m2sd: 147.9, m1sd: 153.5, median: 159.1, p1sd: 164.7, p2sd: 170.2, p3sd: 175.8 },
      { age: '14岁5月', m3sd: 142.4, m2sd: 148.0, m1sd: 153.7, median: 159.3, p1sd: 164.8, p2sd: 170.3, p3sd: 175.8 },
      { age: '14.5岁', m3sd: 142.6, m2sd: 148.2, m1sd: 153.8, median: 159.4, p1sd: 164.9, p2sd: 170.4, p3sd: 175.9 },
      { age: '14岁7月', m3sd: 142.7, m2sd: 148.3, m1sd: 153.9, median: 159.5, p1sd: 165.0, p2sd: 170.5, p3sd: 176.0 },
      { age: '14岁8月', m3sd: 142.8, m2sd: 148.4, m1sd: 154.0, median: 159.5, p1sd: 165.0, p2sd: 170.5, p3sd: 176.0 },
      { age: '14岁9月', m3sd: 143.0, m2sd: 148.5, m1sd: 154.1, median: 159.6, p1sd: 165.1, p2sd: 170.6, p3sd: 176.1 },
      { age: '14岁10月', m3sd: 143.1, m2sd: 148.6, m1sd: 154.1, median: 159.7, p1sd: 165.2, p2sd: 170.7, p3sd: 176.1 },
      { age: '14岁11月', m3sd: 143.2, m2sd: 148.7, m1sd: 154.2, median: 159.7, p1sd: 165.2, p2sd: 170.7, p3sd: 176.2 },
      { age: '15岁', m3sd: 143.3, m2sd: 148.8, m1sd: 154.3, median: 159.8, p1sd: 165.3, p2sd: 170.8, p3sd: 176.2 },
      { age: '15岁1月', m3sd: 143.4, m2sd: 148.9, m1sd: 154.4, median: 159.9, p1sd: 165.4, p2sd: 170.9, p3sd: 176.2 },
      { age: '15岁2月', m3sd: 143.4, m2sd: 148.9, m1sd: 154.4, median: 159.9, p1sd: 165.4, p2sd: 170.9, p3sd: 176.3 },
      { age: '15岁3月', m3sd: 143.5, m2sd: 149.0, m1sd: 154.5, median: 160.0, p1sd: 165.5, p2sd: 171.0, p3sd: 176.3 },
      { age: '15岁4月', m3sd: 143.6, m2sd: 149.1, m1sd: 154.6, median: 160.0, p1sd: 165.5, p2sd: 171.0, p3sd: 176.3 },
      { age: '15岁5月', m3sd: 143.6, m2sd: 149.1, m1sd: 154.6, median: 160.1, p1sd: 165.6, p2sd: 171.1, p3sd: 176.4 },
      { age: '15.5岁', m3sd: 143.7, m2sd: 149.2, m1sd: 154.7, median: 160.1, p1sd: 165.6, p2sd: 171.1, p3sd: 176.4 },
      { age: '15岁7月', m3sd: 143.7, m2sd: 149.2, m1sd: 154.7, median: 160.1, p1sd: 165.6, p2sd: 171.1, p3sd: 176.4 },
      { age: '15岁8月', m3sd: 143.7, m2sd: 149.2, m1sd: 154.7, median: 160.1, p1sd: 165.6, p2sd: 171.1, p3sd: 176.4 },
      { age: '15岁9月', m3sd: 143.7, m2sd: 149.2, m1sd: 154.7, median: 160.1, p1sd: 165.6, p2sd: 171.1, p3sd: 176.4 },
      { age: '15岁10月', m3sd: 143.7, m2sd: 149.2, m1sd: 154.7, median: 160.1, p1sd: 165.5, p2sd: 171.0, p3sd: 176.4 },
      { age: '15岁11月', m3sd: 143.7, m2sd: 149.2, m1sd: 154.7, median: 160.1, p1sd: 165.5, p2sd: 171.0, p3sd: 176.4 },
      { age: '16岁', m3sd: 143.7, m2sd: 149.2, m1sd: 154.7, median: 160.1, p1sd: 165.5, p2sd: 171.0, p3sd: 176.4 },
      { age: '16岁1月', m3sd: 143.7, m2sd: 149.2, m1sd: 154.7, median: 160.1, p1sd: 165.5, p2sd: 171.0, p3sd: 176.4 },
      { age: '16岁2月', m3sd: 143.7, m2sd: 149.2, m1sd: 154.7, median: 160.1, p1sd: 165.5, p2sd: 171.0, p3sd: 176.4 },
      { age: '16岁3月', m3sd: 143.8, m2sd: 149.3, m1sd: 154.7, median: 160.2, p1sd: 165.6, p2sd: 171.0, p3sd: 176.4 },
      { age: '16岁4月', m3sd: 143.8, m2sd: 149.3, m1sd: 154.7, median: 160.2, p1sd: 165.6, p2sd: 171.0, p3sd: 176.4 },
      { age: '16岁5月', m3sd: 143.8, m2sd: 149.3, m1sd: 154.7, median: 160.2, p1sd: 165.6, p2sd: 171.0, p3sd: 176.4 },
      { age: '16.5岁', m3sd: 143.8, m2sd: 149.3, m1sd: 154.7, median: 160.2, p1sd: 165.6, p2sd: 171.0, p3sd: 176.4 },
      { age: '16岁7月', m3sd: 143.8, m2sd: 149.3, m1sd: 154.7, median: 160.2, p1sd: 165.6, p2sd: 171.0, p3sd: 176.4 },
      { age: '16岁8月', m3sd: 143.9, m2sd: 149.4, m1sd: 154.8, median: 160.2, p1sd: 165.6, p2sd: 171.0, p3sd: 176.4 },
      { age: '16岁9月', m3sd: 143.9, m2sd: 149.4, m1sd: 154.8, median: 160.3, p1sd: 165.7, p2sd: 171.0, p3sd: 176.5 },
      { age: '16岁10月', m3sd: 143.9, m2sd: 149.4, m1sd: 154.8, median: 160.3, p1sd: 165.7, p2sd: 171.0, p3sd: 176.5 },
      { age: '16岁11月', m3sd: 144.0, m2sd: 149.5, m1sd: 154.9, median: 160.3, p1sd: 165.7, p2sd: 171.0, p3sd: 176.5 },
      { age: '17岁', m3sd: 144.0, m2sd: 149.5, m1sd: 154.9, median: 160.3, p1sd: 165.7, p2sd: 171.0, p3sd: 176.5 },
      { age: '17岁1月', m3sd: 144.0, m2sd: 149.5, m1sd: 154.9, median: 160.3, p1sd: 165.7, p2sd: 171.0, p3sd: 176.5 },
      { age: '17岁2月', m3sd: 144.1, m2sd: 149.6, m1sd: 155.0, median: 160.4, p1sd: 165.7, p2sd: 171.1, p3sd: 176.5 },
      { age: '17岁3月', m3sd: 144.1, m2sd: 149.6, m1sd: 155.0, median: 160.4, p1sd: 165.8, p2sd: 171.1, p3sd: 176.5 },
      { age: '17岁4月', m3sd: 144.1, m2sd: 149.6, m1sd: 155.0, median: 160.4, p1sd: 165.8, p2sd: 171.1, p3sd: 176.5 },
      { age: '17岁5月', m3sd: 144.2, m2sd: 149.6, m1sd: 155.0, median: 160.4, p1sd: 165.8, p2sd: 171.1, p3sd: 176.5 },
      { age: '17岁6月', m3sd: 144.2, m2sd: 149.7, m1sd: 155.1, median: 160.5, p1sd: 165.8, p2sd: 171.2, p3sd: 176.6 },
      { age: '17岁7月', m3sd: 144.2, m2sd: 149.7, m1sd: 155.1, median: 160.5, p1sd: 165.8, p2sd: 171.2, p3sd: 176.6 },
      { age: '17岁8月', m3sd: 144.3, m2sd: 149.7, m1sd: 155.1, median: 160.5, p1sd: 165.8, p2sd: 171.2, p3sd: 176.6 },
      { age: '17岁9月', m3sd: 144.3, m2sd: 149.7, m1sd: 155.1, median: 160.5, p1sd: 165.9, p2sd: 171.2, p3sd: 176.6 },
      { age: '17岁10月', m3sd: 144.3, m2sd: 149.8, m1sd: 155.2, median: 160.6, p1sd: 165.9, p2sd: 171.3, p3sd: 176.6 },
      { age: '17岁11月', m3sd: 144.4, m2sd: 149.8, m1sd: 155.2, median: 160.6, p1sd: 165.9, p2sd: 171.3, p3sd: 176.6 },
      { age: '18岁', m3sd: 144.4, m2sd: 149.8, m1sd: 155.2, median: 160.6, p1sd: 165.9, p2sd: 171.3, p3sd: 176.6 }
    ];

    // 将数据转换为以月份为索引的映射
    const dataMap = {};
    rawData.forEach(item => {
      const months = this.parseAgeToMonths(item.age);
      dataMap[months] = {
        m3sd: item.m3sd,
        m2sd: item.m2sd,
        m1sd: item.m1sd,
        median: item.median,
        p1sd: item.p1sd,
        p2sd: item.p2sd,
        p3sd: item.p3sd
      };
    });

    // 生成0-216个月的完整数据（使用线性插值填充缺失的月份）
    const fullData = {};
    for (let month = 0; month <= 216; month++) {
      if (dataMap[month]) {
        fullData[month] = dataMap[month];
      } else {
        // 找到最近的两个数据点进行插值
        let lowerMonth = month - 1;
        let upperMonth = month + 1;
        while (lowerMonth >= 0 && !dataMap[lowerMonth]) lowerMonth--;
        while (upperMonth <= 216 && !dataMap[upperMonth]) upperMonth++;
        
        if (lowerMonth >= 0 && upperMonth <= 216) {
          const lowerData = dataMap[lowerMonth];
          const upperData = dataMap[upperMonth];
          const ratio = (month - lowerMonth) / (upperMonth - lowerMonth);
          
          fullData[month] = {
            m3sd: parseFloat((lowerData.m3sd + (upperData.m3sd - lowerData.m3sd) * ratio).toFixed(1)),
            m2sd: parseFloat((lowerData.m2sd + (upperData.m2sd - lowerData.m2sd) * ratio).toFixed(1)),
            m1sd: parseFloat((lowerData.m1sd + (upperData.m1sd - lowerData.m1sd) * ratio).toFixed(1)),
            median: parseFloat((lowerData.median + (upperData.median - lowerData.median) * ratio).toFixed(1)),
            p1sd: parseFloat((lowerData.p1sd + (upperData.p1sd - lowerData.p1sd) * ratio).toFixed(1)),
            p2sd: parseFloat((lowerData.p2sd + (upperData.p2sd - lowerData.p2sd) * ratio).toFixed(1)),
            p3sd: parseFloat((lowerData.p3sd + (upperData.p3sd - lowerData.p3sd) * ratio).toFixed(1))
          };
        } else if (lowerMonth >= 0) {
          fullData[month] = { ...dataMap[lowerMonth] };
        } else if (upperMonth <= 216) {
          fullData[month] = { ...dataMap[upperMonth] };
        }
      }
    }

    return fullData;
  },

  getServerData(pltData) {
    console.log('开始绘制身高图表，使用提供的数据点');
    
    // 生成完整的数据点（0-216个月）
    const standardData = this.generateStandardHeightDataFromPoints();
    
    // 生成0-216个月的完整X轴数据
    const allMonths = [];
    const monthLabels = [];
    for (let month = 0; month <= 216; month += 1) {
      allMonths.push(month);
      // 简化标签格式：每3个月显示一个标签
      if (month % 3 === 0 || month === 0 || month === 216) {
        if (month < 12) {
          monthLabels.push(`${month}月`);
        } else {
          const years = month / 12;
          if (years % 1 === 0) {
            monthLabels.push(`${years}岁`);
          } else {
            monthLabels.push(`${years.toFixed(1)}岁`);
          }
        }
      } else {
        monthLabels.push('');
      }
    }
    
    // 从标准数据中提取7条曲线
    const m3sdData = allMonths.map(month => standardData[month].m3sd);
    const m2sdData = allMonths.map(month => standardData[month].m2sd);
    const m1sdData = allMonths.map(month => standardData[month].m1sd);
    const medianData = allMonths.map(month => standardData[month].median);
    const p1sdData = allMonths.map(month => standardData[month].p1sd);
    const p2sdData = allMonths.map(month => standardData[month].p2sd);
    const p3sdData = allMonths.map(month => standardData[month].p3sd);
    
    // 处理用户真实身高数据（如果有的话）
    // 初始化用户身高数据数组，全部为null（不显示数据点）
    let childHeightData = allMonths.map(() => null);
    
    if (pltData.x_data && pltData.x_data.length > 0 && pltData.chirld_height && pltData.chirld_height.length > 0) {
      // 计算儿童的出生日期
      const birthDate = new Date(this.data.child.birth_time);
      
      // 为每个用户记录计算对应的月龄，并映射到最近的X轴位置
      pltData.x_data.forEach((dateStr, index) => {
        const recordDate = new Date(dateStr);
        const ageInMonths = (recordDate.getFullYear() - birthDate.getFullYear()) * 12 + (recordDate.getMonth() - birthDate.getMonth());
        
        // 找到最接近的X轴位置（allMonths数组中的索引）
        let closestIndex = 0;
        let minDiff = Math.abs(allMonths[0] - ageInMonths);
        for (let i = 1; i < allMonths.length; i++) {
          const diff = Math.abs(allMonths[i] - ageInMonths);
          if (diff < minDiff) {
            minDiff = diff;
            closestIndex = i;
          }
        }
        
        // 如果月龄在合理范围内（0-216个月），则设置对应的身高值
        if (ageInMonths >= 0 && ageInMonths <= 216) {
          const height = parseFloat(pltData.chirld_height[index]);
          if (!isNaN(height)) {
            childHeightData[closestIndex] = parseFloat(height.toFixed(1));
            console.log(`用户数据：月龄${ageInMonths}月，身高${height}cm，映射到X轴位置${allMonths[closestIndex]}月`);
          }
        }
      });
    }
    
    // 构建图表数据，包括所有7条标准SD曲线和1条真实身高曲线，共8条
    let res_height = {
      categories: monthLabels, // 使用固定0-18岁的月份标签
      series: [
        {
          name: "-3SD",
          color: "#E8F4FD", // 浅蓝色
          data: m3sdData
        },
        {
          name: "-2SD",
          color: "#C5E3F9", // 浅蓝色
          data: m2sdData
        },
        {
          name: "-1SD",
          color: "#A9D2F5", // 浅蓝色
          data: m1sdData
        },
        {
          name: "中位数",
          color: "#4A90E2", // 蓝色
          data: medianData
        },
        {
          name: "1SD",
          color: "#A9D2F5", // 浅蓝色
          data: p1sdData
        },
        {
          name: "2SD",
          color: "#C5E3F9", // 浅蓝色
          data: p2sdData
        },
        {
          name: "3SD",
          color: "#E8F4FD", // 浅蓝色
          data: p3sdData
        },
        {
          name: (pltData.name || '儿童') + "身高",
          color: "#FF6B6B", // 红色
          data: childHeightData
        }
      ]
    };
    
    console.log('身高图表数据:', res_height);
    console.log('标准曲线数据点数:', m3sdData.length);
    console.log('用户身高数据点数:', childHeightData.filter(v => v !== null).length);
    
    this.drawCharts('NwbCBhcNOuQXlMCxznViehwgujHjDjVo-height', res_height, "height");
  },

  drawCharts(id, data, t) {
    const ctx = wx.createCanvasContext(id, this);
    console.log('绘制图表:', t, '数据:', data);
    console.log('图表配置中的categories:', data.categories);
    console.log('图表配置中的series:', data.series);
    
    // 检查数据是否为空
    if (!data.categories || data.categories.length === 0) {
      console.error('图表数据为空，无法绘制');
      return;
    }
    
    if (!data.series || data.series.length === 0 || !data.series[0].data || data.series[0].data.length === 0) {
      console.error('图表系列数据为空，无法绘制');
      return;
    }
    
    // 启用滚动和缩放功能
    const dataCount = data.categories.length;
    const screenWidth = this.data.cWidth;
    // 计算合适的图表宽度：每个数据点至少3px宽度，确保可读性
    const minPointWidth = 3;
    const calculatedWidth = dataCount * minPointWidth;
    // 如果计算出的宽度超过屏幕宽度，启用滚动，否则使用计算宽度
    let chartWidth = calculatedWidth > screenWidth ? calculatedWidth : screenWidth;
    let enableScroll = calculatedWidth > screenWidth; // 数据点多时启用滚动
    
    console.log('Height页面数据点数量:', dataCount, '图表宽度:', chartWidth, '启用滚动:', enableScroll);
    
    // 为每个系列设置不同的线型
    data.series.forEach((series, index) => {
      // 前7条是标准SD曲线，使用虚线
      if (index < 7) {
        series.lineType = "dash"; // 虚线
        series.lineWidth = 2;
      } else {
        // 实际身高数据使用实线并加粗
        series.lineType = "solid";
        series.lineWidth = 4;
      }
    });
    
    // 根据标准数据固定Y轴范围（身高：40-180cm，优化显示区域）
    const yAxisMin = 40;
    const yAxisMax = 180;
    
    const chartConfig = {
      type: "line",
      context: ctx,
      width: chartWidth,
      height: this.data.cHeight,
      categories: data.categories,
      series: data.series,
      animation: true,
      background: "#FFFFFF",
      color: ["#E8F4FD", "#C5E3F9", "#A9D2F5", "#4A90E2", "#A9D2F5", "#C5E3F9", "#E8F4FD", "#FF6B6B"],
      padding: [15, 10, 15, 10], // 增加左右padding，优化显示区域
      enableScroll: enableScroll,
      legend: {
        show: true,
        position: "bottom"
      },
      dataLabel: false, // 不显示数据标签，只在tooltip中显示
      xAxis: {
        disableGrid: false,
        scrollShow: enableScroll,
        itemCount: enableScroll ? Math.ceil(screenWidth / minPointWidth) : data.categories.length, // 滚动模式下只显示可见区域的标签数
        boundaryGap: "justify",
        fontSize: 10,
        rotateLabel: false, // 不旋转标签，通过减少标签数量来避免重叠
        // 智能显示标签：每6个月显示一个（0-12月），每12个月显示一个（1-18岁）
        labelCount: enableScroll ? Math.ceil(screenWidth / minPointWidth) : Math.min(37, data.categories.length) // 最多显示37个标签（每6个月一个）
      },
      yAxis: {
        gridType: "dash",
        dashLength: 2,
        title: t === "height" ? "身高(cm)" : "体重(kg)",
        min: yAxisMin,
        max: yAxisMax, // 固定Y轴最大值40-180cm
        splitNumber: 14, // 增加分割数，让纵坐标有更多条线（每10cm一个刻度，共14个刻度）
        format: function (val) {
          return parseFloat(val.toFixed(0)) + (t === "height" ? "cm" : "kg"); // 去掉小数，让刻度更清晰
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
    console.log('图表绘制完成:', t);
  },
  touchstart(e){
    const chartId = e.target.id;
    if (!uChartsInstance[chartId]) return;
    
    // 检测触摸点数量（小程序中使用 e.touches）
    const touches = e.touches || [];
    
    if (touches.length >= 2) {
      // 双指触摸，准备缩放
      this.touchState = {
        isZooming: true,
        chartId: chartId,
        startTime: Date.now()
      };
      // 调用双指缩放方法
      try {
        uChartsInstance[chartId].dobuleZoom(e);
      } catch (err) {
        console.error('双指缩放错误:', err);
      }
    } else if (touches.length === 1) {
      // 单指触摸，准备拖动
      this.touchState = {
        isZooming: false,
        chartId: chartId,
        startTime: Date.now()
      };
      uChartsInstance[chartId].scrollStart(e);
    }
  },
  touchmove(e){
    const chartId = e.target.id;
    if (!uChartsInstance[chartId]) return;
    
    // 小程序中使用 e.touches 获取当前所有触摸点
    const touches = e.touches || [];
    
    if (touches.length >= 2) {
      // 双指移动，执行缩放
      if (this.touchState && this.touchState.isZooming && this.touchState.chartId === chartId) {
        try {
          uChartsInstance[chartId].dobuleZoom(e);
        } catch (err) {
          console.error('双指缩放错误:', err);
        }
      }
    } else if (touches.length === 1) {
      // 单指移动，执行拖动
      if (this.touchState && !this.touchState.isZooming && this.touchState.chartId === chartId) {
        uChartsInstance[chartId].scroll(e);
      }
    }
  },
  touchend(e){
    const chartId = e.target.id;
    if (!uChartsInstance[chartId]) return;
    
    // touchend 事件中，touches 数组会减少，changedTouches 包含抬起的手指
    // 需要检查当前还有多少手指在屏幕上
    const currentTouches = e.touches || [];
    
    // 如果还有触摸点，说明是部分手指抬起，继续处理
    if (currentTouches.length >= 2) {
      // 仍然有双指，继续缩放
      try {
        uChartsInstance[chartId].dobuleZoom(e);
      } catch (err) {
        console.error('双指缩放错误:', err);
      }
    } else if (currentTouches.length === 1) {
      // 只剩单指，转为拖动
      this.touchState = {
        isZooming: false,
        chartId: chartId,
        startTime: Date.now()
      };
      uChartsInstance[chartId].scrollStart(e);
    } else {
      // 所有手指都抬起，结束操作
      // 判断是否为点击（触摸时间很短且没有移动）
      const touchDuration = this.touchState ? Date.now() - this.touchState.startTime : 0;
      if (touchDuration < 200) {
        // 可能是点击，显示 tooltip
        uChartsInstance[chartId].showToolTip(e);
      }
      uChartsInstance[chartId].scrollEnd(e);
      uChartsInstance[chartId].touchLegend(e);
      this.touchState = null;
    }
  }


});
