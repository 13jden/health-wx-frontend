const { request } = require('../utils/request');

/**
 * 报告相关API
 */
const reportApi = {
  /**
   * 获取用户报告列表
   * @param {number} childId - 儿童ID
   * @returns {Promise} 返回报告列表
   */
  getUserReport(childId) {
    return request({
      url: `/report/list/${childId}`,
      method: 'GET'
    });
  }
};

module.exports = reportApi;

