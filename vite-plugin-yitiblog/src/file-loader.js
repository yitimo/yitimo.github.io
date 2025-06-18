// 文件加载器模块
import fs from 'fs'
import path from 'path'
import { parseContent } from './content-parser.js'

/**
 * 读取include文件
 * @param {string} rootDir 项目根目录
 * @returns {object} include文件映射
 */
export function loadIncludes(rootDir) {
  const includesDir = path.join(rootDir, '_includes')
  const includes = {}
  
  if (fs.existsSync(includesDir)) {
    const files = fs.readdirSync(includesDir)
    files.forEach(file => {
      if (file.endsWith('.html')) {
        const includeName = path.basename(file, '.html')
        includes[includeName] = fs.readFileSync(path.join(includesDir, file), 'utf-8')
      }
    })
  }
  
  return includes
}

/**
 * 读取layout文件
 * @param {string} rootDir 项目根目录
 * @returns {object} layout文件映射
 */
export function loadLayouts(rootDir) {
  const layoutsDir = path.join(rootDir, '_layouts')
  const layouts = {}
  
  if (fs.existsSync(layoutsDir)) {
    const files = fs.readdirSync(layoutsDir)
    files.forEach(file => {
      if (file.endsWith('.html')) {
        const layoutName = path.basename(file, '.html')
        layouts[layoutName] = fs.readFileSync(path.join(layoutsDir, file), 'utf-8')
      }
    })
  }
  
  return layouts
}

/**
 * 获取文章的URL路径
 * @param {string} filePath 文件路径
 * @param {string} rootDir 项目根目录
 * @returns {string} URL路径
 */
export function getPostUrl(filePath, rootDir) {
  const relativePath = path.relative(path.join(rootDir, '_posts'), filePath)
  const parsed = path.parse(relativePath)
  
  // 从文件名提取日期信息
  const match = parsed.name.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)$/)
  if (match) {
    const [, year, month, day, slug] = match
    return `/${year}/${month}/${day}/${slug}.html`
  }
  
  // 如果不匹配日期格式，使用目录结构
  return `/${relativePath.replace(/\.md$/, '.html')}`
}

/**
 * 获取所有文章数据
 * @param {string} rootDir 项目根目录
 * @returns {Array} 文章数组
 */
export function getAllPosts(rootDir) {
  const postsDir = path.join(rootDir, '_posts')
  const posts = []
  
  if (!fs.existsSync(postsDir)) {
    return posts
  }

  // 递归获取所有markdown文件
  function getMarkdownFiles(dir) {
    const files = []
    const items = fs.readdirSync(dir)
    
    for (const item of items) {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        files.push(...getMarkdownFiles(fullPath))
      } else if (item.endsWith('.md')) {
        files.push(fullPath)
      }
    }
    
    return files
  }

  const markdownFiles = getMarkdownFiles(postsDir)
  
  for (const filePath of markdownFiles) {
    const content = fs.readFileSync(filePath, 'utf-8')
    const parsed = parseContent(content, true)
    
    const post = {
      ...parsed.frontMatter,
      content: parsed.content,
      url: getPostUrl(filePath, rootDir),
      date: parsed.frontMatter.date || new Date().toISOString()
    }
    
    posts.push(post)
  }
  
  // 按日期排序（最新的在前）
  posts.sort((a, b) => new Date(b.date) - new Date(a.date))
  
  return posts
}
