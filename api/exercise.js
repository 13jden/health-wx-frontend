const { request } = require('../utils/request');

/**
 * 获取儿童运动记录列表
 * @param {number} childId - 儿童ID
 * @returns {Promise} 返回运动记录列表
 */
const getExerciseRecords = async (childId) => {
  const res = await request({
    url: `/exercise-record/child/${childId}`,
    method: 'GET'
  });
  // 处理Result包装
  if (res.data && res.data.data) {
    return res.data.data;
  }
  return res.data || [];
};

/**
 * 快速添加运动记录
 * @param {number} childId - 儿童ID
 * @param {string} content - 输入内容
 * @returns {Promise} 返回添加的记录详情
 */
const addQuickRecord = async (childId, content) => {
  const res = await request({
    url: `/exercise-record/${childId}?content=${encodeURIComponent(content)}`,
    method: 'POST',
    data: {}
  });
  // 处理Result包装
  if (res.data && res.data.data) {
    return res.data.data;
  }
  return res.data;
};

module.exports = { 
  getExerciseRecords,
  addQuickRecord
};


