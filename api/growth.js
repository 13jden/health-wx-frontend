const { request } = require("../utils/request");

/**
 * 生长记录相关API
 */
const growthApi = {
  /**
   * 添加生长记录
   * @param {Object} data - 生长记录数据
   * @returns {Promise}
   */
  addRecord(data) {
    return request({
      url: '/growth-record',
      method: 'POST',
      data
    });
  },

  /**
   * 获取生长记录详情
   * @param {Number} id - 记录ID
   * @returns {Promise}
   */
  getRecord(id) {
    return request({
      url: `/growth-record/${id}`,
      method: 'GET'
    });
  },

  /**
   * 获取儿童生长记录列表
   * @param {Number} childId - 儿童ID
   * @returns {Promise}
   */
  getRecordsByChildId(childId) {
    return request({
      url: `/growth-record/child/${childId}`,
      method: 'GET'
    });
  },

  /**
   * 获取儿童最新记录
   * @param {Number} childId - 儿童ID
   * @param {Number} limit - 记录数量，默认5
   * @returns {Promise}
   */
  getLatestRecords(childId, limit = 5) {
    return request({
      url: `/growth-record/child/${childId}/latest`,
      method: 'GET',
      data: { limit }
    });
  },

  /**
   * 更新生长记录
   * @param {Number} id - 记录ID
   * @param {Object} data - 更新数据
   * @returns {Promise}
   */
  updateRecord(id, data) {
    return request({
      url: `/growth-record/${id}`,
      method: 'PUT',
      data
    });
  },

  /**
   * 删除生长记录
   * @param {Number} id - 记录ID
   * @returns {Promise}
   */
  deleteRecord(id) {
    return request({
      url: `/growth-record/${id}`,
      method: 'DELETE'
    });
  },

  /**
   * 删除儿童所有记录
   * @param {Number} childId - 儿童ID
   * @returns {Promise}
   */
  deleteRecordsByChildId(childId) {
    return request({
      url: `/growth-record/child/${childId}`,
      method: 'DELETE'
    });
  }
};

module.exports = growthApi;
