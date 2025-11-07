/**
 * 订阅消息工具类
 */

/**
 * 请求订阅消息
 * @param {Array} tmplIds - 模板ID数组
 * @param {Object} options - 配置选项
 * @returns {Promise} 订阅结果
 */
export function requestSubscribeMessage(tmplIds, options = {}) {
  return new Promise((resolve, reject) => {
    // 检查基础库版本
    if (wx.canIUse('requestSubscribeMessage')) {
      wx.requestSubscribeMessage({
        tmplIds: tmplIds,
        success: (res) => {
          console.log('订阅消息成功:', res);
          resolve(res);
        },
        fail: (err) => {
          console.error('订阅消息失败:', err);
          reject(err);
        },
        complete: (res) => {
          console.log('订阅消息完成:', res);
        }
      });
    } else {
      console.warn('当前基础库版本不支持订阅消息');
      reject({
        errMsg: '当前基础库版本不支持订阅消息',
        errCode: -1
      });
    }
  });
}

/**
 * 订阅打卡消息
 * @param {Object} options - 配置选项
 * @returns {Promise} 订阅结果
 */
export function subscribeCheckInMessage(options = {}) {
  const CHECK_IN_TEMPLATE_ID = '4OFcdPl680DgcRzmHDs2Jh-DQCyYlkZ2vRfXZ3-ENCk';
  
  return requestSubscribeMessage([CHECK_IN_TEMPLATE_ID], options);
}

/**
 * 检查用户订阅状态
 * @param {Array} tmplIds - 模板ID数组
 * @returns {Promise} 订阅状态
 */
export function checkSubscribeStatus(tmplIds) {
  return new Promise((resolve, reject) => {
    wx.getSetting({
      success: (res) => {
        console.log('获取设置成功:', res);
        const subscribeMsgSettings = res.authSetting['scope.subscribeMessage'];
        resolve(subscribeMsgSettings);
      },
      fail: (err) => {
        console.error('获取设置失败:', err);
        reject(err);
      }
    });
  });
}

/**
 * 显示订阅消息引导弹窗
 * @param {Object} options - 配置选项
 */
export function showSubscribeGuide(options = {}) {
  const {
    title = '开启消息提醒',
    content = '为了及时提醒您进行健康打卡，建议开启消息订阅',
    confirmText = '立即开启',
    cancelText = '暂不开启',
    onConfirm = () => {},
    onCancel = () => {}
  } = options;

  wx.showModal({
    title: title,
    content: content,
    confirmText: confirmText,
    cancelText: cancelText,
    success: (res) => {
      if (res.confirm) {
        onConfirm();
      } else {
        onCancel();
      }
    }
  });
}

/**
 * 处理订阅消息结果
 * @param {Object} result - 订阅结果
 * @param {string} templateId - 模板ID
 * @returns {Object} 处理结果
 */
export function handleSubscribeResult(result, templateId) {
  const status = result[templateId];
  
  switch (status) {
    case 'accept':
      return {
        success: true,
        message: '订阅成功',
        status: 'accept'
      };
    case 'reject':
      return {
        success: false,
        message: '用户拒绝订阅',
        status: 'reject'
      };
    case 'ban':
      return {
        success: false,
        message: '模板被后台封禁',
        status: 'ban'
      };
    case 'filter':
      return {
        success: false,
        message: '模板被后台过滤',
        status: 'filter'
      };
    default:
      return {
        success: false,
        message: '未知状态',
        status: 'unknown'
      };
  }
}
