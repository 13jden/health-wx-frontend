const app = getApp();
const reportApi = require('../../api/report');
const { parseMarkdownAdvanced } = require('../../utils/markdown');
const { autoSubscribeMessage } = require('../../utils/subscribeMessage.js');

Page({
  data: {
    reportList: [],
    loading: true,
    emptyText: '暂无报告数据'
  },

  onLoad() {
    this.loadReports();
  },

  onShow() {
    // 每次显示时刷新数据
    this.loadReports();
    // 如果用户选择了总是允许，自动订阅报告消息
    autoSubscribeMessage('report');
  },

  async loadReports() {
    const childId = app.globalData.nowChildId;
    if (!childId) {
      wx.showToast({
        title: '请先选择儿童',
        icon: 'none'
      });
      this.setData({
        loading: false,
        reportList: []
      });
      return;
    }

    try {
      this.setData({ loading: true });
      const res = await reportApi.getUserReport(childId);
      
      console.log('获取报告列表响应:', res);
      
      // 处理响应数据
      let reportData = [];
      if (res.statusCode === 200 && res.data) {
        // 检查响应结构，可能数据在 res.data.data 中
        if (Array.isArray(res.data)) {
          reportData = res.data;
        } else if (res.data.data && Array.isArray(res.data.data)) {
          reportData = res.data.data;
        }
        
        // 格式化报告数据
        reportData = reportData
          .filter(item => !!item)
          .map((report, index) => this.normalizeReport(report, index));
      }

      this.setData({
        reportList: reportData,
        loading: false
      });
    } catch (error) {
      console.error('获取报告列表失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
      this.setData({
        loading: false,
        reportList: []
      });
    }
  },

  // 格式化日期
  formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      return dateStr;
    }
  },

  // 展开或收起报告详情
  toggleReportDetail(e) {
    const index = e.currentTarget.dataset.index;
    const reportList = this.data.reportList.map((report, idx) => {
      if (idx === index) {
        return { ...report, expanded: !report.expanded };
      }
      return report;
    });

    this.setData({ reportList });
  },

  // 数据归一化，兼容不同字段命名
  normalizeReport(report, index) {
    const exerciseDays = report.exerciseDays || report.exercise_days || report.dailyExerciseDays;
    const dietDays = report.dietDays || report.diet_days || report.dailyDietDays;
    const dateValue = report.createTime || report.create_time || report.reportDate || report.report_date;
    const rawContent = this.getRawReportContent(report, { exerciseDays, dietDays });
    const normalizedContent = this.normalizeMarkdownContent(rawContent);

    return {
      ...report,
      id: report.id || `report-${index}`,
      exerciseDays,
      dietDays,
      createTimeText: this.formatDate(dateValue),
      contentText: this.getReportSummary(normalizedContent),
      htmlContent: this.getReportHtml(normalizedContent),
      rawContent: normalizedContent,
      expanded: false
    };
  },

  // 获取原始报告内容
  getRawReportContent(report, stats = {}) {
    if (report) {
      if (report.content) return report.content;
      if (report.reportContent) return report.reportContent;
      if (report.report_content) return report.report_content;
    }

    const { exerciseDays, dietDays } = stats;
    const parts = [];
    if (exerciseDays) {
      parts.push(`- 坚持锻炼 ${exerciseDays} 天`);
    }
    if (dietDays) {
      parts.push(`- 饮食打卡 ${dietDays} 天`);
    }

    if (parts.length > 0) {
      return `## 健康报告\n${parts.join('\n')}\n\n系统自动生成报告。`;
    }
    return '暂无报告内容';
  },

  // Markdown 预处理，补齐空格等
  normalizeMarkdownContent(content) {
    if (!content) return '';
    let normalized = content
      // 统一换行
      .replace(/\r\n/g, '\n')
      // 压缩多余空行
      .replace(/\n{3,}/g, '\n\n');

    // 在非行首位置的标题前插入换行，避免 "文本###标题" 情况
    normalized = normalized.replace(/([^\n])\s*(#{2,6})/g, '$1\n$2');

    return normalized
      // 为标题添加空格，兼容"###1."这类格式
      .replace(/(#{1,6})(\S)/g, '$1 $2')
      // 调整列表项符号后的空格
      .replace(/([*-])(\S)/g, '$1 $2')
      .trim();
  },

  // 获取列表摘要
  getReportSummary(content) {
    if (!content) {
      return '暂无报告内容';
    }
    const text = content
      .replace(/[#>*`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (text.length <= 70) {
      return text;
    }
    return `${text.slice(0, 70)}...`;
  },

  // 生成 HTML 内容
  getReportHtml(content) {
    if (!content) return '<p>暂无报告内容</p>';
    try {
      return parseMarkdownAdvanced(content);
    } catch (error) {
      console.error('Markdown解析失败:', error);
      return `<p>${content}</p>`;
    }
  }
});

