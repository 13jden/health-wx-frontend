const app = getApp();
const { streamRequest } = require('../../utils/request');
const { parseMarkdownAdvanced } = require('../../utils/markdown');

Page({
  data: {
    inputValue: '',
    messages: [], // { role: 'user'|'assistant', content: string, htmlContent?: string }
    streamBuffer: '', // 流式数据缓冲区
    updateTimer: null, // 节流更新定时器
    scrollIntoView: '',
    autoScrollEnabled: true, // 当用户上滑查看历史时暂停自动滚动
    isStreaming: false, // 是否正在流式输出
    userScrollTimer: null, // 用户滚动检测定时器
    autoScrollTimer: null // 自动滚动定时器
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
      console.log('收到分块数据:', chunkRes);
      console.log('数据类型:', typeof chunkRes.data);
      console.log('数据长度:', chunkRes.data?.length);
      
      // chunkRes.data已经是request.js解码后的字符串
      const textData = chunkRes.data;
      
      if (!textData) {
        console.log('分块数据为空，跳过处理');
        return;
      }
      
      console.log('处理文本数据:', textData);
      console.log('文本数据前50字符:', textData.substring(0, 50));
      
      // 过滤无用内容（如<think>标签）
      if (textData.includes('</think>')) {
        console.log('检测到think标签，跳过处理');
        return;
      }
      
      // 检查是否是完整内容的重复输出（流式传输最后通常会输出完整内容）
      if (this.data.streamBuffer && textData.length > this.data.streamBuffer.length) {
        // 如果新数据长度大于当前缓冲区，且包含已有内容，说明是重复输出
        if (textData.includes(this.data.streamBuffer)) {
          console.log('检测到重复内容，跳过处理');
          return;
        }
      }
      
      // 累积原始数据到缓冲区
      this.data.streamBuffer += textData;
      console.log('更新缓冲区，当前长度:', this.data.streamBuffer.length);
      
      // 实时更新最后一条消息（显示原始累积数据，不进行额外处理）
      this.updateLastMessage(this.data.streamBuffer);
      
      // 节流更新页面
      this.throttleUpdate();
      
      // 启动持续自动滚动
      this.startContinuousScroll();
      
    } catch (e) {
      console.error('处理分块数据异常:', e);
    }
  },

  // 流式响应完成后的处理
  onStreamComplete() {
    // 标记流式输出结束
    this.setData({ isStreaming: false });
    
    // 停止持续自动滚动
    this.stopContinuousScroll();
    
    // 确保最终内容保存到storage
    const messages = [...this.data.messages];
    if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
      let finalContent = this.data.streamBuffer || messages[messages.length - 1].content;
      
      // 将 / 符号转换为换行符
      finalContent = finalContent.replace(/\//g, '\n');
      
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
      
      // 流式输出完成后，强制滚动到底部
      this.scrollToBottom(true);
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
    console.log('更新最后一条消息，内容长度:', content ? content.length : 0);
    
    const messages = [...this.data.messages];
    if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
      // 处理数据：将 / 符号转换为换行符
      let processedContent = content.replace(/\//g, '\n');
      
      console.log('处理后的内容:', processedContent.substring(0, 100) + '...');
      
      // 更新消息内容
      messages[messages.length - 1].content = processedContent;
      
      // 重新生成HTML内容
      try {
        messages[messages.length - 1].htmlContent = parseMarkdownAdvanced(processedContent);
        console.log('Markdown解析成功');
      } catch (e) {
        console.error('Markdown解析失败:', e);
        messages[messages.length - 1].htmlContent = processedContent; // 降级为纯文本
      }
      
      console.log('设置消息数据，消息数量:', messages.length);
      this.setData({ messages }, () => {
        console.log('消息数据设置完成');
        // 真机环境下强制触发页面更新
        this.forceUpdate();
      });
    } else {
      console.log('没有找到assistant消息或消息列表为空');
    }
  },

  // 节流更新，防止频繁渲染影响性能
  throttleUpdate() {
    if (!this.data.updateTimer) {
      this.data.updateTimer = setTimeout(() => {
        // 只有在自动滚动启用时才滚动到底部
        if (this.data.autoScrollEnabled) {
          this.scrollToBottom();
        }
        this.data.updateTimer = null;
      }, 200); // 减少延迟，提高响应速度
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
    
    // 计算距离底部的距离
    const distanceFromBottom = scrollHeight - scrollTop - height;
    
    // 如果用户滚动到距离底部较远的位置（超过200px），则暂停自动滚动
    if (distanceFromBottom > 200) {
      if (this.data.autoScrollEnabled) {
        this.setData({ autoScrollEnabled: false });
        console.log('用户滚动到距离底部较远位置，暂停自动滚动');
      }
    }
    // 如果用户滚动到接近底部（小于100px），则恢复自动滚动
    else if (distanceFromBottom < 100) {
      if (!this.data.autoScrollEnabled && this.data.isStreaming) {
        this.setData({ autoScrollEnabled: true });
        console.log('用户滚动到接近底部，恢复自动滚动');
      }
    }
  },

  // 触底时重新开启自动滚动
  onReachBottom() {
    if (!this.data.autoScrollEnabled) {
      this.setData({ autoScrollEnabled: true }, () => this.scrollToBottom(true));
      console.log('用户触底，恢复自动滚动');
    }
  },

  // 启动持续自动滚动
  startContinuousScroll() {
    // 如果已经在持续滚动，不重复启动
    if (this.data.autoScrollTimer) {
      return;
    }
    
    // 只有在流式输出且自动滚动启用时才启动
    if (this.data.isStreaming && this.data.autoScrollEnabled) {
      this.data.autoScrollTimer = setInterval(() => {
        if (this.data.isStreaming && this.data.autoScrollEnabled) {
          this.scrollToBottom();
        } else {
          this.stopContinuousScroll();
        }
      }, 100); // 每100ms检查一次
    }
  },

  // 停止持续自动滚动
  stopContinuousScroll() {
    if (this.data.autoScrollTimer) {
      clearInterval(this.data.autoScrollTimer);
      this.data.autoScrollTimer = null;
    }
  },

  // 强制更新页面（真机环境下的兼容性处理）
  forceUpdate() {
    // 通过临时修改一个无关的数据来强制触发页面更新
    const currentTime = Date.now();
    this.setData({ 
      _forceUpdate: currentTime 
    }, () => {
      // 立即清除，避免影响其他逻辑
      setTimeout(() => {
        this.setData({ _forceUpdate: null });
      }, 10);
    });
  },

  async onSend() {
    const content = (this.data.inputValue || '').trim();
    if (!content) return;

    // 1) 追加用户消息并清空输入框
    this.appendMessage({ role: 'user', content });
    this.setData({ inputValue: '' });

    // 2) 清空流式缓冲区，开始流式输出
    this.setData({ 
      streamBuffer: '',
      isStreaming: true,
      autoScrollEnabled: true // 开始新的对话时重新启用自动滚动
    });

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
    console.log('添加assistant消息');
    this.appendMessage({ role: 'assistant', content: '正在思考中...' });
    console.log('当前消息数量:', this.data.messages.length);

    try {
      // 5) 发送流式请求
      // 按后端Schema构建请求体
      const currentChildId = wx.getStorageSync('currentChildId');
      const payload = {
        content, // 用户问题
        memory: sanitizedMemory,
        attachments: [],
        childId: currentChildId || null // 添加儿童ID参数
      };

      const res = await streamRequest({
        url: `/chat/stream/text`, // 后端接口是 /stream/{type}，这里 type 为 "text"
        method: 'POST', // 使用 POST 因为需要 @RequestBody
        data: payload,
        onChunkReceived: (chunkRes) => {
          // 处理分块数据
          console.log('收到流式数据回调');
          this.handleChunkData(chunkRes);
        }
      });
      
      console.log('流式请求完成，结果:', res);
      
      // 流式传输完成，保存最终结果
      this.onStreamComplete();
      
      // 如果流式传输失败，使用默认回复
      if (!res.isStreaming) {
        console.log('流式传输失败，使用默认回复');
        this.updateLastMessage('已收到，医生正在分析...');
        this.onStreamComplete();
      }
      
      // 真机环境下的备用检查：如果5秒后仍然没有内容更新，强制显示默认消息
      setTimeout(() => {
        if (this.data.isStreaming && this.data.streamBuffer.length === 0) {
          console.log('真机环境备用机制：显示默认消息');
          this.updateLastMessage('医生正在分析您的问题，请稍候...');
        }
      }, 5000);
      
      // 真机环境下的额外检查：如果10秒后仍然没有内容更新，显示错误信息
      setTimeout(() => {
        if (this.data.isStreaming && this.data.streamBuffer.length === 0) {
          console.log('真机环境超时处理：显示错误信息');
          this.updateLastMessage('网络连接异常，请检查网络后重试');
          this.onStreamComplete();
        }
      }, 10000);
      
    } catch (e) {
      console.error('发送失败:', e);
      wx.showToast({ title: '发送失败', icon: 'none' });
      // 更新最后一条消息为错误信息
      this.updateLastMessage('发送失败，请重试');
      this.onStreamComplete();
    } finally {
      // 确保流式状态被重置
      this.setData({ isStreaming: false });
      // 停止持续自动滚动
      this.stopContinuousScroll();
    }
  }
});


