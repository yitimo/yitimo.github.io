// 内容解析模块
import MarkdownIt from 'markdown-it'
import yaml from 'yaml'

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

/**
 * 解析文件的front matter（支持markdown和HTML）
 * @param {string} content 文件内容
 * @param {boolean} isMarkdown 是否为markdown文件
 * @returns {object} 解析结果
 */
export function parseContent(content, isMarkdown = true) {
  const frontMatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/
  const match = content.match(frontMatterRegex)
  
  if (match) {
    try {
      const frontMatter = yaml.parse(match[1])
      const bodyContent = match[2]
      const htmlContent = isMarkdown ? md.render(bodyContent) : bodyContent
      
      return {
        frontMatter,
        content: htmlContent,
        rawContent: bodyContent
      }
    } catch (error) {
      console.warn('Failed to parse YAML front matter:', error.message)
      return {
        frontMatter: {},
        content: isMarkdown ? md.render(content) : content,
        rawContent: content
      }
    }
  } else {
    return {
      frontMatter: {},
      content: isMarkdown ? md.render(content) : content,
      rawContent: content
    }
  }
}
