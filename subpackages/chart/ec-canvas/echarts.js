// 微信小程序适配 echarts
// 由于构建 npm 失败（argparse 等依赖不兼容），使用手动复制的文件
// 
// 使用说明：
// 请手动将 node_modules/echarts/dist/echarts.min.js 复制到当前目录（ec-canvas/echarts.min.js）
// 或者使用文件管理器直接复制文件

// 微信小程序环境适配：在加载 echarts 之前设置环境
// 为 window 和 global 对象添加小程序环境需要的方法
(function() {
  const addEventListenerPolyfill = function() {};
  const removeEventListenerPolyfill = function() {};
  
  // 为 window 对象添加（如果存在）
  if (typeof window !== 'undefined') {
    if (!window.addEventListener) {
      window.addEventListener = addEventListenerPolyfill;
    }
    if (!window.removeEventListener) {
      window.removeEventListener = removeEventListenerPolyfill;
    }
  }
  
  // 为 global 对象添加（小程序环境）
  if (typeof global !== 'undefined') {
    if (!global.addEventListener) {
      global.addEventListener = addEventListenerPolyfill;
    }
    if (!global.removeEventListener) {
      global.removeEventListener = removeEventListenerPolyfill;
    }
  }
})();

let echarts = null;

// 方案1: 优先尝试使用本地复制的文件（推荐，因为构建 npm 会失败）
try {
  echarts = require('./echarts.min.js');
  console.log('✓ 使用本地复制的 echarts 文件');
} catch (e) {
  console.error('✗ 无法从本地文件加载 echarts');
  // 方案2: 尝试从 node_modules 直接引用（通常不工作）
  try {
    echarts = require('../../node_modules/echarts/dist/echarts.min.js');
    console.log('✓ 使用 node_modules 中的 echarts');
  } catch (e2) {
    console.error('✗ 无法从 node_modules 加载 echarts');
    console.error('');
    console.error('请手动执行以下操作：');
    console.error('1. 找到文件：node_modules/echarts/dist/echarts.min.js');
    console.error('2. 复制到：ec-canvas/echarts.min.js');
    console.error('3. 重新编译运行');
    // 返回一个空对象避免程序崩溃
    echarts = {
      init: function() {
        console.error('echarts 未正确加载，请按照上述说明复制文件');
        return null;
      }
    };
  }
}

module.exports = echarts;
