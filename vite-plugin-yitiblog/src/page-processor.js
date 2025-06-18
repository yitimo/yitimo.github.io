// 页面处理模块
import fs from 'fs'
import path from 'path'
import { parseContent } from './content-parser.js'
import { loadIncludes, loadLayouts, getAllPosts, getPostUrl } from './file-loader.js'

/**
 * 处理所有页面文件（_pages目录）
 * @param {string} rootDir 项目根目录
 * @param {object} blogConfig 博客配置
 * @param {function} renderTemplate 模板渲染函数
 */
export function processPages(rootDir, blogConfig, renderTemplate) {
  const pagesDir = path.join(rootDir, '_pages')
  const outputDir = path.join(rootDir, blogConfig.dist || 'docs')
  
  const includes = loadIncludes(rootDir)
  const layouts = loadLayouts(rootDir)
  const posts = getAllPosts(rootDir) // 只调用一次getAllPosts
  
  if (!fs.existsSync(pagesDir)) {
    console.warn('_pages directory not found')
    return
  }

  const files = fs.readdirSync(pagesDir)
  
  for (const file of files) {
    if (!file.endsWith('.html')) continue
    
    const filePath = path.join(pagesDir, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    const parsed = parseContent(content, false) // HTML文件不需要markdown解析
    
    // 创建页面数据
    const pageData = {
      site: {
        ...blogConfig,
        posts: posts // 使用已经加载的posts
      },
      page: {
        ...parsed.frontMatter,
        content: parsed.content,
      },
      content: parsed.content
    }
    
    // 先渲染页面内容中的includes和loops
    const renderedContent = renderTemplate(parsed.content, pageData, includes)
    
    // 更新页面数据
    pageData.content = renderedContent
    pageData.page.content = renderedContent
    
    // 获取布局
    const layoutName = parsed.frontMatter.layout || 'home'
    const layout = layouts[layoutName]
    
    if (!layout) {
      console.warn(`Layout '${layoutName}' not found for ${filePath}`)
      continue
    }
    
    // 渲染最终HTML
    const html = renderTemplate(layout, pageData, includes)
    
    // 确定输出路径
    const outputPath = path.join(outputDir, file)
    
    // 写入文件
    fs.writeFileSync(outputPath, html, 'utf-8')
    
    console.log(`Generated page: ${file}`)
  }
}

/**
 * 处理所有markdown文件
 * @param {string} rootDir 项目根目录
 * @param {object} blogConfig 博客配置
 * @param {function} renderTemplate 模板渲染函数
 */
export function processMarkdownFiles(rootDir, blogConfig, renderTemplate) {
  const postsDir = path.join(rootDir, '_posts')
  const outputDir = path.join(rootDir, blogConfig.dist || 'docs')
  
  const includes = loadIncludes(rootDir)
  const layouts = loadLayouts(rootDir)
  const allPosts = getAllPosts(rootDir) // 只调用一次getAllPosts
  
  if (!fs.existsSync(postsDir)) {
    console.warn('_posts directory not found')
    return
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
    const parsed = parseContent(content, true) // markdown文件
    
    const currentUrl = getPostUrl(filePath, rootDir)
    
    // 找到当前文章在所有文章中的位置
    const currentPostIndex = allPosts.findIndex(post => post.url === currentUrl)
    
    // 获取上一篇和下一篇文章（按时间顺序）
    const previousPost = currentPostIndex > 0 ? allPosts[currentPostIndex - 1] : null
    const nextPost = currentPostIndex < allPosts.length - 1 ? allPosts[currentPostIndex + 1] : null
    
    // 创建页面数据
    const pageData = {
      site: {
        ...blogConfig,
        posts: allPosts // 使用已经加载的posts
      },
      page: {
        ...parsed.frontMatter,
        content: parsed.content,
        url: currentUrl,
        previous: previousPost,
        next: nextPost
      },
      content: parsed.content
    }
    
    // 获取布局
    const layoutName = parsed.frontMatter.layout || 'post'
    const layout = layouts[layoutName]
    
    if (!layout) {
      console.warn(`Layout '${layoutName}' not found for ${filePath}`)
      continue
    }
    
    // 渲染最终HTML
    const html = renderTemplate(layout, pageData, includes)
    
    // 确定输出路径
    const outputPath = path.join(outputDir, currentUrl.slice(1)) // 移除开头的/
    const outputDirPath = path.dirname(outputPath)
    
    // 创建输出目录
    fs.mkdirSync(outputDirPath, { recursive: true })
    
    // 写入文件
    fs.writeFileSync(outputPath, html, 'utf-8')
    
    console.log(`Generated: ${currentUrl}`)
  }
}
