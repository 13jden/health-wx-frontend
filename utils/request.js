const app = getApp();

// UTF-8解码工具函数，兼容微信小程序环境
function utf8Decode(bytes) {
  if (!bytes || bytes.length === 0) return '';
  
  // 如果已经是字符串，直接返回
  if (typeof bytes === 'string') return bytes;
  
  // 如果是Uint8Array或ArrayBuffer，进行UTF-8解码
  let uint8Array;
  if (bytes instanceof ArrayBuffer) {
    uint8Array = new Uint8Array(bytes);
  } else if (bytes instanceof Uint8Array) {
    uint8Array = bytes;
  } else if (Array.isArray(bytes)) {
    uint8Array = new Uint8Array(bytes);
  } else {
    return String(bytes);
  }
  
  let result = '';
  let i = 0;
  
  while (i < uint8Array.length) {
    let byte1 = uint8Array[i++];
    
    if (byte1 < 0x80) {
      // 单字节字符 (ASCII)
      result += String.fromCharCode(byte1);
    } else if ((byte1 >> 5) === 0x06) {
      // 双字节字符
      if (i >= uint8Array.length) break;
      let byte2 = uint8Array[i++];
      result += String.fromCharCode(((byte1 & 0x1F) << 6) | (byte2 & 0x3F));
    } else if ((byte1 >> 4) === 0x0E) {
      // 三字节字符
      if (i + 1 >= uint8Array.length) break;
      let byte2 = uint8Array[i++];
      let byte3 = uint8Array[i++];
      result += String.fromCharCode(((byte1 & 0x0F) << 12) | ((byte2 & 0x3F) << 6) | (byte3 & 0x3F));
    } else if ((byte1 >> 3) === 0x1E) {
      // 四字节字符 (代理对)
      if (i + 2 >= uint8Array.length) break;
      let byte2 = uint8Array[i++];
      let byte3 = uint8Array[i++];
      let byte4 = uint8Array[i++];
      let codePoint = ((byte1 & 0x07) << 18) | ((byte2 & 0x3F) << 12) | ((byte3 & 0x3F) << 6) | (byte4 & 0x3F);
      codePoint -= 0x10000;
      result += String.fromCharCode(0xD800 + (codePoint >> 10));
      result += String.fromCharCode(0xDC00 + (codePoint & 0x3FF));
    } else {
      // 无效字节，跳过
      continue;
    }
  }
  
  return result;
}

/**
 * 普通HTTP请求工具
 * 用于常规API调用，如登录、注册等
 */
const request = (options) => {
  const tokenUser = wx.getStorageSync("tokenUser");
  
  return new Promise((resolve, reject) => {
    // 确保apiBase存在
    const apiBase = app.globalData.apiBase || 'http://localhost:8081/';
    const baseUrl = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
    const requestUrl = options.url.startsWith('/') ? options.url : `/${options.url}`;
    
    wx.request({
      url: `${baseUrl}${requestUrl}`,
      method: options.method || "GET",
      header: {
        "Content-Type": "application/json; charset=utf-8",
        "Accept": "application/json; charset=utf-8",
        "Authorization": tokenUser ? `Bearer ${tokenUser.token}` : ""
      },
      data: options.data || {},
      success(res) {
        // 处理401未授权
        if (res.statusCode === 401) {
          wx.removeStorageSync("tokenUser");
          app.globalData.tokenUser = null;
          wx.showToast({
            title: "登录已过期，请重新登录",
            icon: "none"
          });
          wx.navigateTo({
            url: "/pages/login/login"
          });
          return;
        }
        
        // 处理403权限不足
        if (res.statusCode === 403) {
          wx.showToast({
            title: "权限不足",
            icon: "none"
          });
        }
        
        resolve(res);
      },
      fail(err) {
        wx.showToast({
          title: "请求失败，请检查网络",
          icon: "none",
          duration: 2000
        });
        reject(err);
      }
    });
  });
};

/**
 * 流式请求工具
 * 用于处理流式数据响应，如AI对话等
 */
const streamRequest = (options) => {
  const tokenUser = wx.getStorageSync("tokenUser");
  
  return new Promise((resolve, reject) => {
    // 确保apiBase存在
    const apiBase = app.globalData.apiBase || 'http://localhost:8081/';
    const baseUrl = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
    const requestUrl = options.url.startsWith('/') ? options.url : `/${options.url}`;
    
    const requestTask = wx.request({
      url: `${baseUrl}${requestUrl}`,
      method: options.method || "GET",
      header: {
        "Content-Type": "application/json; charset=utf-8",
        "Accept": "text/event-stream",
        "Authorization": tokenUser ? `Bearer ${tokenUser.token}` : ""
      },
      data: options.data || {},
      enableChunked: true,
      responseType: 'arraybuffer',
      success(res) {
        resolve({ isStreaming: true, statusCode: res.statusCode });
      },
      fail(err) {
        wx.showToast({
          title: "请求失败，请检查网络",
          icon: "none",
          duration: 2000
        });
        reject(err);
      }
    });

    // 处理流式响应的分块数据
    if (requestTask && requestTask.onChunkReceived) {
      requestTask.onChunkReceived((chunkRes) => {
        if (chunkRes.data) {
          try {
            let textData = utf8Decode(chunkRes.data);
            const decodedChunkRes = {
              ...chunkRes,
              data: textData,
              originalData: chunkRes.data
            };
            
            if (options.onChunkReceived && typeof options.onChunkReceived === 'function') {
              options.onChunkReceived(decodedChunkRes);
            }
          } catch (e) {
            if (options.onChunkReceived && typeof options.onChunkReceived === 'function') {
              options.onChunkReceived(chunkRes);
            }
          }
        } else {
          if (options.onChunkReceived && typeof options.onChunkReceived === 'function') {
            options.onChunkReceived(chunkRes);
          }
        }
      });
    }
  });
};

module.exports = { request, streamRequest };
