// 官方 echarts-for-weixin 组件实现
// 参考: https://github.com/ecomfe/echarts-for-weixin

const echarts = require('../../ec-canvas/echarts.js');

Component({
  properties: {
    ec: {
      type: Object
    }
  },

  data: {

  },

  ready: function () {
    if (this.properties.ec && this.properties.ec.onInit) {
      this.init();
    }
  },

  observers: {
    'ec': function(ec) {
      if (ec && ec.onInit) {
        this.init();
      }
    }
  },

  methods: {
    init: function () {
      if (this.chart) {
        return; // 防止重复初始化
      }

      const query = wx.createSelectorQuery().in(this);
      query.select('#ec-canvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res || !res[0] || !res[0].node) {
            console.error('无法获取canvas节点');
            return;
          }

          const canvas = res[0].node;
          const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
          const dpr = systemInfo.pixelRatio || 1;
          const width = res[0].width;
          const height = res[0].height;

          // 初始化 2D 上下文并同步尺寸，确保 echarts 能正确绘制
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            console.error('无法获取canvas 2D上下文');
            return;
          }
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          ctx.scale(dpr, dpr);
          canvas.style = canvas.style || {};
          canvas.style.width = `${width}px`;
          canvas.style.height = `${height}px`;
          if (!canvas.requestAnimationFrame) {
            canvas.requestAnimationFrame = callback => setTimeout(callback, 1000 / 60);
          }
          if (!canvas.cancelAnimationFrame) {
            canvas.cancelAnimationFrame = timer => clearTimeout(timer);
          }
          if (!canvas.setChart) {
            canvas.setChart = function(chart) {
              this._chart = chart;
              return chart;
            };
          }

          // 保存 canvas 信息
          this.canvasNode = canvas;
          this.canvasWidth = width;
          this.canvasHeight = height;

          // 调用 onInit 回调函数
          if (this.properties.ec && this.properties.ec.onInit) {
            this.chart = this.properties.ec.onInit(canvas, width, height, dpr);
          }
        });
    },

    // 触摸开始事件
    touchStart: function(e) {
      // 不处理，避免影响性能
    },

    // 触摸移动事件
    touchMove: function(e) {
      // 不处理，避免影响性能
    },

    // 触摸结束事件
    touchEnd: function(e) {
      console.log('=== Canvas 触摸结束 ===', e);
      this.handleTouch(e, 'touchend');
    },

    // 处理触摸事件
    handleTouch: function(e, type) {
      // 只在触摸结束时处理，避免频繁查询影响性能
      if (type !== 'touchend') {
        return;
      }

      if (!this.chart) {
        console.log('图表未初始化，无法处理触摸事件');
        return;
      }

      // 获取触摸点
      const touch = e.changedTouches && e.changedTouches[0];
      if (!touch) {
        console.log('无法获取触摸点信息');
        return;
      }

      // 使用保存的 canvas 信息或重新查询
      const that = this;
      const query = wx.createSelectorQuery().in(this);
      query.select('#ec-canvas')
        .boundingClientRect()
        .exec((res) => {
          if (!res || !res[0]) {
            console.log('无法获取 canvas 位置信息');
            return;
          }

          const rect = res[0];
          // 计算相对于 canvas 的坐标
          const x = touch.clientX - rect.left;
          const y = touch.clientY - rect.top;

          console.log('触摸坐标:', { x, y, clientX: touch.clientX, clientY: touch.clientY, rectWidth: rect.width, rectHeight: rect.height });

          // 确保坐标在有效范围内
          if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
            console.log('触摸坐标超出 canvas 范围');
            return;
          }

          // 使用 ECharts 的 dispatchAction 触发 tooltip
          try {
            // 触发 tooltip 显示
            that.chart.dispatchAction({
              type: 'showTip',
              x: x,
              y: y
            });

            console.log('已触发 ECharts showTip action，坐标:', { x, y });
          } catch (error) {
            console.error('触发 ECharts action 失败:', error);
          }

          // 手动触发点击事件回调
          if (that.properties.ec && that.properties.ec.onTouchEnd) {
            that.properties.ec.onTouchEnd(x, y, that.chart);
          }
        });
    }
  }
});
