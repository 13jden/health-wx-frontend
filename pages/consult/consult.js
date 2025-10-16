const app = getApp();
const { request } = require('../../utils/request');
const { parseMarkdownAdvanced } = require('../../utils/markdown');

Page({
  data: {
    inputValue: '',
    messages: [], // { role: 'user'|'assistant', content: string, htmlContent?: string }
    streamBuffer: '', // 流式数据缓冲区
    updateTimer: null, // 节流更新定时器
    scrollIntoView: '',
    autoScrollEnabled: true // 当用户上滑查看历史时暂停自动滚动
  },

  onLoad() {
    const history = wx.getStorageSync('consult_messages') || [];
    this.setData({ messages: history }, () => {
      // 首次进入，将视图定位到最后一条
      this.scrollToBottom(true);
    });
  },

  onInput(e) {
    this.setData({ inputValue: e.detail.value });
  },

  appendMessage(message) {
    // 如果是assistant消息，生成HTML内容用于markdown渲染
    if (message.role === 'assistant' && message.content) {
      try {
        message.htmlContent = parseMarkdownAdvanced(message.content);
      } catch (e) {
        console.error('Markdown解析失败:', e);
        message.htmlContent = message.content; // 降级为纯文本
      }
    }
    
    const newMessages = [...this.data.messages, message];
    this.setData({ messages: newMessages });
    wx.setStorageSync('consult_messages', newMessages);
  },

  // 处理分块数据 - 处理已解码的文本数据
  handleChunkData(chunkRes) {
    try {
      // chunkRes.data已经是request.js解码后的字符串
      const textData = chunkRes.data;
      
      if (!textData) {
        return;
      }
      
      // 过滤无用内容（如<think>标签）
      if (textData.includes('</think>')) {
        return;
      }
      
      // 直接累积到缓冲区
      this.data.streamBuffer += textData;
      
      // 实时更新最后一条消息
      this.updateLastMessage(this.data.streamBuffer);
      
      // 节流更新页面
      this.throttleUpdate();
      
    } catch (e) {
      console.error('处理分块数据异常:', e);
    }
  },

  // 流式响应完成后的处理
  onStreamComplete() {
    // 确保最终内容保存到storage
    const messages = [...this.data.messages];
    if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
      let finalContent = this.data.streamBuffer || messages[messages.length - 1].content;
      
      // 清理多余的符号和空白字符
      finalContent = this.cleanContent(finalContent);
      
      messages[messages.length - 1].content = finalContent;
      
      // 重新生成HTML内容
      try {
        messages[messages.length - 1].htmlContent = parseMarkdownAdvanced(finalContent);
      } catch (e) {
        console.error('Markdown解析失败:', e);
        messages[messages.length - 1].htmlContent = finalContent;
      }
      
      // 保存到storage
      wx.setStorageSync('consult_messages', messages);
      this.setData({ messages });
    }
  },

  // 清理内容，去除多余的符号和空白字符
  cleanContent(content) {
    if (!content) return content;
    
    // 去除开头和结尾的空白字符
    content = content.trim();
    
    // 去除末尾多余的标点符号和符号
    // 匹配末尾的重复标点符号（如：。、。、。等）
    content = content.replace(/[。，、；：！？]+$/, '');
    
    // 去除末尾的重复符号（如：、、、、等）
    content = content.replace(/[、。，；：！？]{2,}$/, '');
    
    // 去除末尾单个多余的符号（保留正常的标点符号）
    content = content.replace(/[、]+$/, '');
    
    // 去除多余的空行
    content = content.replace(/\n{3,}/g, '\n\n');
    
    return content;
  },

  // 更新最后一条消息内容
  updateLastMessage(content) {
    const messages = [...this.data.messages];
    if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
      // 实时更新时不进行过度清理，保持流式效果
      messages[messages.length - 1].content = content;
      
      // 重新生成HTML内容
      try {
        messages[messages.length - 1].htmlContent = parseMarkdownAdvanced(content);
      } catch (e) {
        console.error('Markdown解析失败:', e);
        messages[messages.length - 1].htmlContent = content; // 降级为纯文本
      }
      
      this.setData({ messages });
    }
  },

  // 节流更新，防止频繁渲染影响性能
  throttleUpdate() {
    if (!this.data.updateTimer) {
      this.data.updateTimer = setTimeout(() => {
        // 滚动到底部
        this.scrollToBottom();
        this.data.updateTimer = null;
      }, 300);
    }
  },

  // 滚动到底部：通过 scroll-into-view 锚点到最后一条
  scrollToBottom(force) {
    if (!force && !this.data.autoScrollEnabled) return;
    // 锚定到底部哨兵，避免长消息被只滚到开头
    this.setData({ scrollIntoView: 'scroll-bottom' });
    // 防止持续“吸底”，短暂锚定后清空，以便用户停留在底部而不被拉回
    setTimeout(() => {
      if (this.data.scrollIntoView === 'scroll-bottom') {
        this.setData({ scrollIntoView: '' });
      }
    }, 120);
  },

  // 监听聊天列表滚动，决定是否暂停自动滚动
  onChatScroll(e) {
    const { scrollTop, scrollHeight, height } = e.detail;
    
    // 限制向上滚动，防止滑到第一条消息之上
    if (scrollTop <= 0) {
      // 如果已经滚动到顶部，强制保持在顶部
      this.setData({ scrollIntoView: '' });
      return;
    }
    
    // 只要用户产生滚动事件就认为可能在查看历史，先暂停自动滚动
    if (this.data.autoScrollEnabled) {
      this.setData({ autoScrollEnabled: false });
    }
  },

  // 触底时重新开启自动滚动
  onReachBottom() {
    if (!this.data.autoScrollEnabled) {
      this.setData({ autoScrollEnabled: true }, () => this.scrollToBottom(true));
    }
  },

  async onSend() {
    const content = (this.data.inputValue || '').trim();
    if (!content) return;

    // 1) 追加用户消息并清空输入框
    this.appendMessage({ role: 'user', content });
    this.setData({ inputValue: '' });

    // 2) 清空流式缓冲区
    this.setData({ streamBuffer: '' });

    // 3) 组织 ChatRequest：只发送最近5条有效的对话记录（在添加assistant消息之前）
    const allMessages = this.data.messages || [];
    const recentMessages = allMessages
      .filter(m => m && (m.role === 'user' || m.role === 'assistant'))
      .slice(-5); // 只取最近5条消息，按后端 Memory(role, content) 结构发送

    // 避免出现null/undefined导致后端反序列化为{}的情况
    const sanitizedMemory = recentMessages.map(m => ({
      role: (m && (m.role === 'user' || m.role === 'assistant')) ? m.role : 'user',
      content: (m && typeof m.content === 'string') ? m.content : (m && m.content != null) ? String(m.content) : ''
    }));

    // 4) 先添加一个空的assistant消息，用于实时更新
    this.appendMessage({ role: 'assistant', content: '正在思考中...' });

    try {
      // 5) 发送流式请求
      // 按后端Schema构建请求体
      const payload = {
        content, // 用户问题
        memory: sanitizedMemory,
        attachments: []
      };

      const res = await request({
        url: `/chat/stream/text`, // 后端接口是 /stream/{type}，这里 type 为 "text"
        method: 'POST', // 使用 POST 因为需要 @RequestBody
        data: payload,
        enableChunked: true, // 启用分块传输
        onChunkReceived: (chunkRes) => {
          // 处理分块数据
          this.handleChunkData(chunkRes);
        }
      });
      
      // 流式传输完成，保存最终结果
      this.onStreamComplete();
      
      // 如果流式传输失败，使用默认回复
      if (!res.isStreaming) {
        this.updateLastMessage('已收到，医生正在分析...');
        this.onStreamComplete();
      }
      
    } catch (e) {
      console.error('发送失败:', e);
      wx.showToast({ title: '发送失败', icon: 'none' });
      // 更新最后一条消息为错误信息
      this.updateLastMessage('发送失败，请重试');
      this.onStreamComplete();
    }
  }
});


