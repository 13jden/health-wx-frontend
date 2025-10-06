const app = getApp();

const request = (options) => {
  const sessionid = wx.getStorageSync("sessionid");
  
  // 在开发模式下，如果没有sessionid，设置一个默认值而不是跳转登录页
  if (!sessionid) {
    // 设置一个临时的sessionid用于开发测试
    wx.setStorageSync("sessionid", "dev_session_" + Date.now());
    console.log("开发模式：设置临时sessionid");
  }

  return new Promise((resolve, reject) => {
    // 注释掉实际的网络请求，使用静态数据
    /*
    wx.request({
      url: `${app.globalData.baseURL}${options.url}`,
      method: options.method || "GET",
      header: {
        "content-type": "application/json",
        "cookie": `sessionid=${sessionid};csrftoken=${wx.getStorageSync("csrf_token")}`,
        "X-CSRFToken": wx.getStorageSync("csrf_token")  // 发送 CSRF Token
      },
      data: options.data || {},
      success(res) {
        if (res.statusCode === 403) {
          wx.showToast({
            title: "权限不足，请重新登录",
          });
          wx.navigateTo({
            url: "/pages/login/login"
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
    */
    
    // 使用静态数据模拟请求响应
    setTimeout(() => {
      // 根据不同的URL返回不同的静态数据
      let mockData = {};
      
      if (options.url.includes('login')) {
        mockData = {
          statusCode: 200,
          data: {
            success: true,
            message: "登录成功",
            user: {
              id: 1,
              name: "测试用户",
              avatar: "/assets/images/default-avatar.png"
            },
            sessionid: "mock_session_id_12345",
            csrf_token: "mock_csrf_token_67890"
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
  });
};

module.exports = { request };
