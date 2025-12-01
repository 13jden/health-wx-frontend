const MarkdownIt = require('./markdown-it-lib');

// 基于 markdown-it 的 Markdown 渲染器，启用换行和链接识别
const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
  typographer: true
});

function renderMarkdown(text) {
  if (!text) return '';
  try {
    return markdown.render(String(text));
  } catch (error) {
    console.error('Markdown-it 渲染失败:', error);
    return String(text);
  }
}

module.exports = {
  parseMarkdown: renderMarkdown,
  parseMarkdownAdvanced: renderMarkdown
};
