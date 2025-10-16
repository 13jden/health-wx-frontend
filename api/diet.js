const { request } = require('../utils/request');

// 先使用模拟：本地聚合与静态数据
const fetchTodayDiet = async (childId) => {
  // 假数据
  const list = [
    { id: 1, mealType: '早餐', foodName: '牛奶', calories: 150 },
    { id: 2, mealType: '午餐', foodName: '米饭', calories: 300 },
    { id: 3, mealType: '晚餐', foodName: '鸡胸肉', calories: 220 }
  ];
  const totalCalories = list.reduce((s, i) => s + (i.calories || 0), 0);
  const basalCalories = 1200; // 基础代谢（示意）
  return { list, totalCalories, basalCalories };
};

const addDietRecord = async (payload) => {
  // 预留真实接口
  // return request({ url: '/diet/record', method: 'POST', data: payload });
  return { success: true };
};

module.exports = { fetchTodayDiet, addDietRecord };


