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

    // ===== 触摸事件映射到 ECharts（官方推荐写法，保证 tooltip / axisPointer 正常工作） =====
    // 将小程序 touch 坐标转换为相对于 canvas 的坐标，再映射到 zr 事件
    touchStart: function (e) {
      if (!this.chart) return;
      const zr = this.chart.getZr();
      if (!zr || !zr.handler) return;

      const touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
      if (!touch) return;

      const query = wx.createSelectorQuery().in(this);
      query.select('#ec-canvas').boundingClientRect().exec(res => {
        if (!res || !res[0]) return;
        const rect = res[0];
        const zrX = touch.clientX - rect.left;
        const zrY = touch.clientY - rect.top;

        zr.handler.dispatch('mousedown', {
          zrX,
          zrY,
          preventDefault: function () {},
          stopImmediatePropagation: function () {}
        });
        zr.handler.dispatch('mousemove', {
          zrX,
          zrY,
          preventDefault: function () {},
          stopImmediatePropagation: function () {}
        });
      });
    },

    touchMove: function (e) {
      if (!this.chart) return;
      const zr = this.chart.getZr();
      if (!zr || !zr.handler) return;

      const touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
      if (!touch) return;

      const query = wx.createSelectorQuery().in(this);
      query.select('#ec-canvas').boundingClientRect().exec(res => {
        if (!res || !res[0]) return;
        const rect = res[0];
        const zrX = touch.clientX - rect.left;
        const zrY = touch.clientY - rect.top;

        zr.handler.dispatch('mousemove', {
          zrX,
          zrY,
          preventDefault: function () {},
          stopImmediatePropagation: function () {}
        });
      });
    },

    touchEnd: function (e) {
      console.log('=== Canvas 触摸结束 ===', e);

      if (!this.chart) return;
      const zr = this.chart.getZr();
      if (!zr || !zr.handler) return;

      const touch = (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0]);
      if (!touch) return;

      const query = wx.createSelectorQuery().in(this);
      query.select('#ec-canvas').boundingClientRect().exec(res => {
        if (!res || !res[0]) return;
        const rect = res[0];
        const zrX = touch.clientX - rect.left;
        const zrY = touch.clientY - rect.top;

        zr.handler.dispatch('mouseup', {
          zrX,
          zrY,
          preventDefault: function () {},
          stopImmediatePropagation: function () {}
        });
        zr.handler.dispatch('click', {
          zrX,
          zrY,
          preventDefault: function () {},
          stopImmediatePropagation: function () {}
        });

        // 如果页面还有自定义回调，依然调用一下（例如想知道点击坐标）
        if (this.properties.ec && typeof this.properties.ec.onTouchEnd === 'function') {
          this.properties.ec.onTouchEnd(zrX, zrY, this.chart);
        }
      });
    }
  }
});
