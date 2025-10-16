const app = getApp();

// 语音记录上传到 chat 接口，type 固定为 record，附件字段名 attach
const sendVoiceRecord = ({ filePath, childId, extra = {} }) => {
  return new Promise((resolve, reject) => {
    const tokenUser = wx.getStorageSync("tokenUser");
    const baseUrl = app.globalData.apiBase.endsWith('/') ? app.globalData.apiBase.slice(0, -1) : app.globalData.apiBase;
    
    // 构建请求体数据
    const requestBody = {
      childId: childId || app.globalData.nowChildId || '',
      ...extra
    };
    
    // 由于是 @GetMapping 但有 @RequestBody，使用 POST 方法
    const url = `${baseUrl}/chat/stream/record`;
    wx.uploadFile({
      url: url,
      filePath,
      name: 'attach',
      method: 'POST', // 使用 POST 因为需要 @RequestBody
      header: {
        'Authorization': tokenUser ? `Bearer ${tokenUser.token}` : '',
        'Content-Type': 'multipart/form-data'
      },
      formData: {
        // 将请求体数据作为 formData 传递
        requestBody: JSON.stringify(requestBody)
      },
      success: (res) => resolve(res),
      fail: (err) => reject(err)
    });
  });
};

module.exports = { sendVoiceRecord };


