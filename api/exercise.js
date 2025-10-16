// 模拟运动记录
const fetchTodayExercise = async (childId) => {
  const list = [
    { id: 1, type: '跑步', durationMin: 30, calories: 180 },
    { id: 2, type: '骑行', durationMin: 20, calories: 120 }
  ];
  const totalCalories = list.reduce((s, i) => s + (i.calories || 0), 0);
  return { list, totalCalories };
};

module.exports = { fetchTodayExercise };


