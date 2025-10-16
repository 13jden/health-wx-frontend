/**
 * 简单的Markdown解析器
 * 支持基本的Markdown语法，适用于微信小程序
 */

// 简单的Markdown解析器
function parseMarkdown(text) {
  if (!text) return '';
  
  let html = text;
  
  // 转义HTML特殊字符
  html = html.replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/>/g, '&gt;');
  
  // 标题 (### 标题)
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // 粗体 **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // 斜体 *text*
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // 代码 `code`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // 代码块 ```code```
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  
  // 引用 > text
  html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
  
  // 无序列表 - item
  html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  // 有序列表 1. item
  html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
  
  // 链接 [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  // 换行处理
  html = html.replace(/\n/g, '<br/>');
  
  return html;
}

// 更高级的Markdown解析器，支持嵌套结构
function parseMarkdownAdvanced(text) {
  if (!text) return '';
  
  let html = text;

  // 预处理：将多个连续空行压缩为单个空行
  html = html.replace(/\n{3,}/g, '\n\n');
  
  // 转义HTML特殊字符
  html = html.replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/>/g, '&gt;');
  
  // 代码块处理（优先处理，避免其他规则影响）
  html = html.replace(/```([\s\S]*?)```/g, function(match, code) {
    return '<pre><code>' + code.trim() + '</code></pre>';
  });
  
  // 标题处理
  html = html.replace(/^#{6}\s+(.*$)/gim, '<h6>$1</h6>');
  html = html.replace(/^#{5}\s+(.*$)/gim, '<h5>$1</h5>');
  html = html.replace(/^#{4}\s+(.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^#{3}\s+(.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^#{2}\s+(.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^#{1}\s+(.*$)/gim, '<h1>$1</h1>');
  
  // 引用处理
  html = html.replace(/^>\s+(.*$)/gim, '<blockquote>$1</blockquote>');
  
  // 列表处理 - 更精确的匹配
  const lines = html.split('\n');
  let inList = false;
  let listType = '';
  let listItems = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 检查无序列表
    if (line.match(/^[\s]*[-*+]\s+(.*)$/)) {
      if (!inList || listType !== 'ul') {
        if (inList && listType === 'ol') {
          // 结束有序列表
          lines[i - 1] = '<ol>' + listItems.join('') + '</ol>';
          listItems = [];
        }
        inList = true;
        listType = 'ul';
      }
      const match = line.match(/^[\s]*[-*+]\s+(.*)$/);
      listItems.push('<li>' + match[1] + '</li>');
      lines[i] = '';
    }
    // 检查有序列表
    else if (line.match(/^[\s]*\d+\.\s+(.*)$/)) {
      if (!inList || listType !== 'ol') {
        if (inList && listType === 'ul') {
          // 结束无序列表
          lines[i - 1] = '<ul>' + listItems.join('') + '</ul>';
          listItems = [];
        }
        inList = true;
        listType = 'ol';
      }
      const match = line.match(/^[\s]*\d+\.\s+(.*)$/);
      listItems.push('<li>' + match[1] + '</li>');
      lines[i] = '';
    }
    // 非列表行
    else {
      if (inList) {
        // 结束当前列表
        if (listType === 'ul') {
          lines[i - 1] = '<ul>' + listItems.join('') + '</ul>';
        } else {
          lines[i - 1] = '<ol>' + listItems.join('') + '</ol>';
        }
        listItems = [];
        inList = false;
        listType = '';
      }
    }
  }
  
  // 处理最后一个列表
  if (inList && listItems.length > 0) {
    if (listType === 'ul') {
      lines[lines.length - 1] = '<ul>' + listItems.join('') + '</ul>';
    } else {
      lines[lines.length - 1] = '<ol>' + listItems.join('') + '</ol>';
    }
  }
  
  html = lines.join('\n');
  
  // 粗体和斜体（需要处理嵌套）
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // 内联代码
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // 链接
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  // 段落处理（将连续的非空行包装为段落），并忽略多余空行
  html = html.replace(/([^\n]*)(\n|$)/g, function(match, content, newline) {
    // 跳过已经是HTML标签的行
    if (content.match(/^<(h[1-6]|ul|ol|li|blockquote|pre|code)/)) {
      return match;
    }
    // 跳过空白行
    if (!content || /^\s*$/.test(content)) {
      return newline || '';
    }
    return '<p>' + content + '</p>' + (newline || '');
  });
  
  // 换行处理：段落间空行保留为一个 <br/>（已压缩）
  html = html.replace(/\n/g, '<br/>');
  
  return html;
}

module.exports = {
  parseMarkdown,
  parseMarkdownAdvanced
};
