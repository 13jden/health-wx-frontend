const app = getApp();

// 注意：buf2hex 和 hexToStr 函数已移除
// 现在直接使用 TextDecoder 处理 UTF-8 字节流，更高效且正确

/**
 * 网络请求工具
 * 支持JWT token认证和流式传输
 * 
 * 开发模式切换：
 * 1. 使用实际API：保持当前代码不变
 * 2. 使用模拟数据：注释掉wx.request部分，取消注释模拟数据部分
 */
const request = (options) => {
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
      enableChunked: options.enableChunked || false, // 支持分块传输
      responseType: options.enableChunked ? 'arraybuffer' : 'json', // 流式响应使用arraybuffer类型
      success(res) {
        // 对于流式响应，success回调中通常没有完整数据
        if (options.enableChunked) {
          // 流式请求的最终结果通过onChunkReceived处理，这里resolve一个标识
          resolve({ isStreaming: true, statusCode: res.statusCode });
        } else {
          // 普通请求直接resolve结果
          if (res.statusCode === 401) {
            // 未授权，清除本地存储并跳转到登录页
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
          if (res.statusCode === 403) {
            wx.showToast({
              title: "权限不足",
              icon: "none"
            });
          }
          resolve(res);
        }
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
    if (options.enableChunked && requestTask && requestTask.onChunkReceived) {
      requestTask.onChunkReceived((chunkRes) => {
        // 处理UTF-8编码的字节流数据
        if (chunkRes.data) {
          try {
            let textData = '';
            
            // 更准确的类型检测
            if (chunkRes.data instanceof ArrayBuffer) {
              // 情况1: ArrayBuffer类型 - 转换为Uint8Array后解码
              const bytes = new Uint8Array(chunkRes.data);
              const decoder = new TextDecoder('utf-8');
              textData = decoder.decode(bytes);
            } else if (chunkRes.data instanceof Uint8Array || 
                      (chunkRes.data.constructor && chunkRes.data.constructor.name === 'Uint8Array') ||
                      (chunkRes.data.length !== undefined && typeof chunkRes.data === 'object' && !Array.isArray(chunkRes.data))) {
              // 情况2: Uint8Array类型 - 直接解码UTF-8字节流
              const decoder = new TextDecoder('utf-8');
              textData = decoder.decode(chunkRes.data);
            } else if (Array.isArray(chunkRes.data)) {
              // 情况3: 数字数组类型 - 转换为Uint8Array后解码
              const bytes = new Uint8Array(chunkRes.data);
              const decoder = new TextDecoder('utf-8');
              textData = decoder.decode(bytes);
            } else if (typeof chunkRes.data === 'string') {
              // 情况4: 字符串类型 - 直接使用，不进行额外解码
              textData = chunkRes.data;
            } else {
              // 情况5: 其他类型，尝试转换为字符串
              textData = String(chunkRes.data);
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
            // 如果解码失败，直接传递原始数据
            if (options.onChunkReceived && typeof options.onChunkReceived === 'function') {
              options.onChunkReceived(chunkRes);
            }
          }
        } else {
          // 如果没有数据，直接传递
          if (options.onChunkReceived && typeof options.onChunkReceived === 'function') {
            options.onChunkReceived(chunkRes);
          }
        }
      });
    } else if (options.enableChunked) {
      console.warn('当前环境不支持onChunkReceived，降级为普通请求');
      // 如果不支持流式传输，可以在这里处理降级逻辑
    }
    
    // 开发模式下的模拟数据（注释掉实际请求时使用）
    /*
    
    // 使用静态数据模拟请求响应
    setTimeout(() => {
      // 根据不同的URL返回不同的静态数据
      let mockData = {};
      
      if (options.url.includes('/api/auth/login')) {
        // 模拟微信登录
        if (options.data && options.data.loginType === "WX") {
          mockData = {
            statusCode: 200,
            data: {
              success: true,
              message: "登录成功",
              data: {
                token: "mock_jwt_token_12345",
                user: {
                  id: 1,
                  username: "测试用户",
                  phone: "138****8888",
                  openId: options.data.openid,
                  avatar: "/assets/images/default-avatar.png"
                }
              }
            }
          };
        } else {
          // 模拟登录失败（未注册）
          mockData = {
            statusCode: 401,
            data: {
              success: false,
              message: "用户未注册"
            }
          };
        }
      } else if (options.url.includes('/api/user/register')) {
        mockData = {
          statusCode: 200,
          data: {
            success: true,
            message: "注册成功"
          }
        };
      } else if (options.url.includes('profile')) {
        mockData = {
          statusCode: 200,
          data: {
            success: true,
            user: {
              id: 1,
              name: "测试用户",
              phone: "138****8888",
              avatar: "/assets/images/default-avatar.png",
              gender: "男",
              age: 30,
              height: 175,
              weight: 70
            }
          }
        };
      } else if (options.url.includes('appointment')) {
        mockData = {
          statusCode: 200,
          data: {
            success: true,
            appointments: [
              {
                id: 1,
                doctor: "张医生",
                department: "儿科",
                date: "2024-01-15",
                time: "09:00",
                status: "已预约"
              },
              {
                id: 2,
                doctor: "李医生", 
                department: "内科",
                date: "2024-01-16",
                time: "14:30",
                status: "已完成"
              }
            ]
          }
        };
      } else if (options.url.includes('children')) {
        mockData = {
          statusCode: 200,
          data: {
            success: true,
            children: [
              {
                id: 1,
                name: "小明",
                age: 5,
                gender: "男",
                height: 110,
                weight: 20,
                birthDate: "2019-01-01"
              }
            ]
          }
        };
      } else if (options.url.includes('growth')) {
        mockData = {
          statusCode: 200,
          data: {
            success: true,
            growthRecords: [
              {
                id: 1,
                date: "2024-01-01",
                height: 110,
                weight: 20,
                age: 5
              },
              {
                id: 2,
                date: "2024-01-15",
                height: 112,
                weight: 21,
                age: 5
              }
            ]
          }
        };
      } else {
        // 默认返回成功响应
        mockData = {
          statusCode: 200,
          data: {
            success: true,
            message: "请求成功",
            data: []
          }
        };
      }
      
      resolve(mockData);
    }, 500); // 模拟网络延迟
    */
  });
};

module.exports = { request };
