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
    // 实际的网络请求
    // 确保URL格式正确，避免双斜杠
    const baseUrl = app.globalData.apiBase.endsWith('/') ? app.globalData.apiBase.slice(0, -1) : app.globalData.apiBase;
    const requestUrl = options.url.startsWith('/') ? options.url : `/${options.url}`;
    
    const requestTask = wx.request({
      url: `${baseUrl}${requestUrl}`,
      method: options.method || "GET",
      header: {
        "Content-Type": "application/json; charset=utf-8",
        "Accept": "application/json; charset=utf-8",
        "Authorization": tokenUser ? `Bearer ${tokenUser.token}` : "" // 使用JWT token
      },
      data: options.data || {},
      enableChunked: true, // 支持分块传输
      responseType: 'arraybuffer', // 流式响应使用arraybuffer类型
      timeout: 30000, // 设置30秒超时
      success(res) {
        // 流式请求的最终结果通过onChunkReceived处理，这里resolve一个标识
        resolve({ isStreaming: true, statusCode: res.statusCode });
      },
      fail(err) {
        console.error('请求失败:', err);
        console.error('失败详情:', JSON.stringify(err));
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
        // 处理UTF-8编码的字节流数据
        if (chunkRes.data) {
          try {
            let textData = '';
            
            // 更准确的类型检测，兼容真机环境
            console.log('原始数据类型:', typeof chunkRes.data, chunkRes.data.constructor?.name);
            console.log('原始数据长度:', chunkRes.data?.length);
            
            if (chunkRes.data instanceof ArrayBuffer) {
              // 情况1: ArrayBuffer类型 - 使用兼容性更好的解码方式
              const bytes = new Uint8Array(chunkRes.data);
              // 真机环境可能不支持TextDecoder，使用自定义UTF-8解码
              textData = utf8Decode(bytes);
              console.log('ArrayBuffer解码结果:', textData.substring(0, 50));
            } else if (chunkRes.data instanceof Uint8Array || 
                      (chunkRes.data.constructor && chunkRes.data.constructor.name === 'Uint8Array') ||
                      (chunkRes.data.length !== undefined && typeof chunkRes.data === 'object' && !Array.isArray(chunkRes.data))) {
              // 情况2: Uint8Array类型 - 使用自定义UTF-8解码
              textData = utf8Decode(chunkRes.data);
              console.log('Uint8Array解码结果:', textData.substring(0, 50));
            } else if (Array.isArray(chunkRes.data)) {
              // 情况3: 数字数组类型 - 转换为Uint8Array后解码
              const bytes = new Uint8Array(chunkRes.data);
              textData = utf8Decode(bytes);
              console.log('数组解码结果:', textData.substring(0, 50));
            } else if (typeof chunkRes.data === 'string') {
              // 情况4: 字符串类型 - 直接使用，不进行额外解码
              textData = chunkRes.data;
              console.log('字符串数据:', textData.substring(0, 50));
            } else {
              // 情况5: 其他类型，尝试转换为字符串
              textData = String(chunkRes.data);
              console.log('其他类型转换结果:', textData.substring(0, 50));
            }
            
            // 创建包含解码后数据的响应对象
            const decodedChunkRes = {
              ...chunkRes,
              data: textData,
              originalData: chunkRes.data // 保留原始数据
            };
            
            // 调用用户提供的分块数据处理函数
            if (options.onChunkReceived && typeof options.onChunkReceived === 'function') {
              options.onChunkReceived(decodedChunkRes);
            }
          } catch (e) {
            console.error('解码分块数据失败:', e);
            // 如果解码失败，尝试简单的字符串转换
            try {
              let fallbackText = '';
              if (chunkRes.data instanceof ArrayBuffer) {
                const bytes = new Uint8Array(chunkRes.data);
                fallbackText = String.fromCharCode.apply(null, bytes);
              } else if (Array.isArray(chunkRes.data)) {
                fallbackText = String.fromCharCode.apply(null, chunkRes.data);
              } else {
                fallbackText = String(chunkRes.data);
              }
              
              console.log('备用解码结果:', fallbackText.substring(0, 50));
              
              const fallbackChunkRes = {
                ...chunkRes,
                data: fallbackText
              };
              
              if (options.onChunkReceived && typeof options.onChunkReceived === 'function') {
                options.onChunkReceived(fallbackChunkRes);
              }
            } catch (fallbackError) {
              console.error('备用解码也失败:', fallbackError);
              // 最后的备用方案：直接传递原始数据
              if (options.onChunkReceived && typeof options.onChunkReceived === 'function') {
                options.onChunkReceived(chunkRes);
              }
            }
          }
        } else {
          // 如果没有数据，直接传递
          if (options.onChunkReceived && typeof options.onChunkReceived === 'function') {
            options.onChunkReceived(chunkRes);
          }
        }
      });
    } else {
      console.warn('当前环境不支持onChunkReceived，降级为普通请求');
      // 如果不支持流式传输，可以在这里处理降级逻辑
    }
  });
};

/**
 * 处理流式响应数据
 * 只去掉data:前缀，保持原始换行格式
 */
const processStreamData = (rawData) => {
  if (!rawData) return '';
  
  // 只去掉data:前缀，保持原始换行格式
  let processedData = rawData.replace(/^data:\s*/gm, '');
  
  // 去掉开头和结尾的空白字符
  processedData = processedData.trim();
  
  return processedData;
};

/**
 * 处理流式响应数据为HTML格式
 * 只去掉data:前缀，保持原始换行格式，转换为HTML
 */
const processStreamDataToHtml = (rawData) => {
  if (!rawData) return '';
  
  // 只去掉data:前缀，保持原始换行格式
  let processedData = rawData.replace(/^data:\s*/gm, '');
  
  // 去掉开头和结尾的空白字符
  processedData = processedData.trim();
  
  // 将 / 符号转换为换行符
  processedData = processedData.replace(/\//g, '\n');
  
  // 转换为HTML格式，将换行转换为<br/>标签
  let htmlContent = processedData.replace(/\n/g, '<br/>');
  
  // 减少多余的<br/>标签，避免间距过大
  // 将连续的<br/>标签合并为最多1个
  htmlContent = htmlContent.replace(/(<br\/?>){1,}/g, '<br/>');
  
  return htmlContent;
};

module.exports = { request, streamRequest, processStreamData, processStreamDataToHtml };
