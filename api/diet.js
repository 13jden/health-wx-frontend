const { request } = require('../utils/request');
const app = getApp();

/**
 * 获取儿童饮食记录列表
 * @param {number} childId - 儿童ID
 * @returns {Promise} 返回饮食记录列表
 */
const getDietRecords = async (childId) => {
  const res = await request({
    url: `/diet-record/child/${childId}`,
    method: 'GET'
  });
  // 处理Result包装
  if (res.data && res.data.data) {
    return res.data.data;
  }
  return res.data || [];
};

/**
 * 上传饮食图片
 * @param {string} filePath - 图片文件路径
 * @returns {Promise} 返回图片URL
 */
const uploadDietImage = async (filePath) => {
  const tokenUser = wx.getStorageSync("tokenUser");
  const baseUrl = app.globalData.apiBase.endsWith('/') ? app.globalData.apiBase.slice(0, -1) : app.globalData.apiBase;
  
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: `${baseUrl}/diet-record/upload`,
      filePath: filePath,
      name: 'image',
      header: {
        'Authorization': tokenUser ? `Bearer ${tokenUser.token}` : ''
      },
      success: (res) => {
        try {
          const data = JSON.parse(res.data);
          // 检查code是否为1（成功）或200，并确保data字段存在
          if ((data.code === 1 || data.code === 200) && data.data) {
            resolve(data.data);
          } else {
            reject(new Error(data.message || data.msg || '上传失败'));
          }
        } catch (e) {
          reject(new Error('解析响应失败'));
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
};

/**
 * 快速添加饮食记录（通过图片URL列表）
 * @param {number} childId - 儿童ID
 * @param {Array<string>} imageList - 图片URL列表
 * @param {string} mealType - 餐次类型
 * @param {string} recordDate - 记录日期 (YYYY-MM-DD格式)
 * @param {string} recordTime - 用餐时间 (HH:mm格式，可选)
 * @returns {Promise} 返回添加的记录详情
 */
const addQuickRecordByUrls = async (childId, imageList, mealType, recordDate, recordTime) => {
  // 构建请求体 JSON 对象，对应 DietRecordDto.QuickInput
  const requestBody = {
    imageList: imageList || [],
    mealType: mealType,
    recordDate: recordDate
  };
  
  // 如果提供了用餐时间，添加到请求体中
  if (recordTime) {
    requestBody.recordTime = recordTime;
  }
  
  console.log('发送请求数据:', JSON.stringify(requestBody, null, 2));
  console.log('请求URL:', `/diet-record/${childId}`);
  
  const res = await request({
    url: `/diet-record/${childId}`,
    method: 'POST',
    data: requestBody
  });
  
  console.log('响应数据:', res);
  
  // 处理Result包装
  if (res.data && res.data.data) {
    return res.data.data;
  }
  return res.data;
};

module.exports = { 
  getDietRecords,
  uploadDietImage,
  addQuickRecordByUrls
};


