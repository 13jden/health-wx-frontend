const { request } = require('../utils/request');

/**
 * 儿童管理API
 */
module.exports = {
  /**
   * 添加儿童信息
   * @param {Object} data - 儿童信息
   * @param {string} data.name - 儿童姓名
   * @param {string} data.gender - 性别
   * @param {string} data.birthdate - 出生日期 (YYYY-MM-DD)
   * @param {number} data.parentId - 父用户ID
   * @param {number} [data.height] - 身高(cm)
   * @param {number} [data.weight] - 体重(kg)
   * @param {number} [data.bmi] - BMI指数
   * @param {number} [data.boneAge] - 骨龄
   * @param {string} [data.testDate] - 检测日期 (YYYY-MM-DD)
   * @returns {Promise} 返回添加结果
   */
  addChild(data) {
    return request({
      url: '/child',
      method: 'POST',
      data
    });
  },

  /**
   * 获取儿童详情
   * @param {number} id - 儿童ID
   * @returns {Promise} 返回儿童详情
   */
  getChild(id) {
    return request({
      url: `/child/${id}`,
      method: 'GET'
    });
  },

  /**
   * 更新儿童信息
   * @param {number} id - 儿童ID
   * @param {Object} data - 更新的儿童信息
   * @param {string} [data.name] - 儿童姓名
   * @param {string} [data.gender] - 性别
   * @param {string} [data.birthdate] - 出生日期 (YYYY-MM-DD)
   * @param {number} [data.height] - 身高(cm)
   * @param {number} [data.weight] - 体重(kg)
   * @param {number} [data.bmi] - BMI指数
   * @param {number} [data.boneAge] - 骨龄
   * @param {string} [data.testDate] - 检测日期 (YYYY-MM-DD)
   * @returns {Promise} 返回更新结果
   */
  updateChild(id, data) {
    return request({
      url: `/child/${id}`,
      method: 'PUT',
      data
    });
  },

  /**
   * 删除儿童信息
   * @param {number} id - 儿童ID
   * @returns {Promise} 返回删除结果
   */
  deleteChild(id) {
    return request({
      url: `/child/${id}`,
      method: 'DELETE'
    });
  },

  /**
   * 获取当前用户的所有儿童列表
   * @param {number} parentId - 家长ID
   * @returns {Promise} 返回儿童列表
   */
  getChildrenByParent(parentId) {
    return request({
      url: `/child/parent/${parentId}`,
      method: 'GET'
    });
  },

  /**
   * 获取所有儿童列表（旧接口，用于回退）
   * @returns {Promise} 返回儿童列表
   */
  getAllChildren() {
    return request({
      url: '/child/',
      method: 'GET'
    });
  }
};
