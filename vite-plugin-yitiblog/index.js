// Yitiblog Vite插件 - 重构版本
import path from 'path'
import { loadBlogConfig } from './src/config.js'
import { precompileAllScss, compileSingleScssFile } from './src/scss-compiler.js'
import { LiquidEngine } from './src/liquid-engine.js'
import { copyStaticAssets } from './src/asset-handler.js'
import { processPages, processMarkdownFiles } from './src/page-processor.js'

export default function yitiblog(options = {}) {
  let config
  let blogConfig
  
  // SCSS编译缓存
  const compiledScssCache = new Map()
  
  // 创建Liquid引擎实例
  let liquidEngine

  // 渲染模板 - 使用Liquid引擎
  function renderTemplate(template, data, includes = {}) {
    return liquidEngine.render(template, data, includes, blogConfig)
  }

  return {
    name: 'yitiblog',
    configResolved(resolvedConfig) {
      config = resolvedConfig
      blogConfig = loadBlogConfig(config.root)
      
      // 初始化Liquid引擎
      liquidEngine = new LiquidEngine(config, compiledScssCache)
    },
    buildStart() {
      // 在构建开始时处理文件，只在构建模式下执行
      if (config.command === 'build') {
        // 首先预编译所有SCSS文件
        precompileAllScss(config.root, blogConfig, compiledScssCache)
        
        processMarkdownFiles(config.root, blogConfig, renderTemplate)
        processPages(config.root, blogConfig, renderTemplate)
        copyStaticAssets(config.root, blogConfig)
      }
    },
    configureServer(server) {
      // 开发模式下先预编译SCSS文件
      precompileAllScss(config.root, blogConfig, compiledScssCache)
      
      // 开发模式下监听文件变化
      const chokidar = server.watcher
      
      chokidar.add([
        path.join(config.root, '_posts/**/*.md'),
        path.join(config.root, '_layouts/**/*.html'),
        path.join(config.root, '_includes/**/*.html'),
        path.join(config.root, '_pages/**/*.html'),
        path.join(config.root, '_styles/**/*.scss') // 添加SCSS文件监听
      ])
      
      chokidar.on('change', (filePath) => {
        if (filePath.includes('_styles') && filePath.endsWith('.scss')) {
          // SCSS文件变化时，清除缓存并重新编译
          console.log(`SCSS file changed: ${filePath}`)
          const fileName = path.basename(filePath)
          compiledScssCache.delete(fileName)
          
          // 重新编译变化的SCSS文件
          const success = compileSingleScssFile(filePath, fileName, config.root, blogConfig)
          if (success) {
            const cssFileName = fileName.replace(/\.scss$/, '.css')
            compiledScssCache.set(fileName, cssFileName)
          }
        } else if (filePath.includes('_posts') || filePath.includes('_layouts') || filePath.includes('_includes') || filePath.includes('_pages')) {
          console.log(`File changed: ${filePath}`)
          processMarkdownFiles(config.root, blogConfig, renderTemplate)
          processPages(config.root, blogConfig, renderTemplate)
        }
      })
    }
  }
}
