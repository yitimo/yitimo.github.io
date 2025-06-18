// SCSS编译相关功能
import fs from 'fs'
import path from 'path'
import * as sass from 'sass'

/**
 * 编译单个SCSS文件
 * @param {string} scssPath SCSS文件路径
 * @param {string} fileName 文件名
 * @param {string} rootDir 项目根目录
 * @param {object} blogConfig 博客配置
 * @returns {boolean} 编译是否成功
 */
export function compileSingleScssFile(scssPath, fileName, rootDir, blogConfig) {
  try {
    const outputDir = path.join(rootDir, blogConfig.dist || 'docs')
    
    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    
    // 使用sass编译
    const result = sass.compile(scssPath, {
      style: 'compressed', // 压缩输出
      sourceMap: true, // 生成Source Map
      sourceMapIncludeSources: true,
      loadPaths: [
        path.dirname(scssPath), // 设置@import/@use查找路径
        path.join(rootDir, '_styles'), // 添加styles目录为查找路径
        path.join(rootDir, 'node_modules') // 添加node_modules查找路径
      ]
    })
    
    // 生成CSS文件名
    const cssFileName = fileName.replace(/\.scss$/, '.css')
    const cssOutputPath = path.join(outputDir, cssFileName)
    
    // 写入CSS文件
    fs.writeFileSync(cssOutputPath, result.css, 'utf-8')
    
    // 写入Source Map文件
    if (result.sourceMap) {
      const mapFileName = cssFileName + '.map'
      const mapOutputPath = path.join(outputDir, mapFileName)
      fs.writeFileSync(mapOutputPath, JSON.stringify(result.sourceMap), 'utf-8')
    }
    
    console.log(`✅ Compiled SCSS: ${fileName} → ${cssFileName}`)
    return true
    
  } catch (error) {
    console.error(`❌ Failed to compile SCSS ${fileName}:`)
    console.error(`   ${error.message}`)
    
    // 显示更详细的错误信息
    if (error.span) {
      console.error(`   at line ${error.span.start.line + 1}, column ${error.span.start.column + 1}`)
    }
    return false
  }
}

/**
 * 预编译所有SCSS文件
 * @param {string} rootDir 项目根目录
 * @param {object} blogConfig 博客配置
 * @param {Map} compiledScssCache 编译缓存
 */
export function precompileAllScss(rootDir, blogConfig, compiledScssCache) {
  const stylesDir = path.join(rootDir, '_styles')
  
  if (!fs.existsSync(stylesDir)) {
    console.warn('_styles directory not found')
    return
  }
  
  // 获取所有SCSS文件，过滤掉不需要单独编译的文件
  const allScssFiles = fs.readdirSync(stylesDir).filter(file => file.endsWith('.scss'))
  
  // 排除只用于导入的文件（如变量文件、mixins等）
  const excludePatterns = [
    'variable.scss',  // 变量文件不需要单独编译
    '_*.scss'         // 以下划线开头的partial文件不需要单独编译
  ]
  
  const scssFiles = allScssFiles.filter(fileName => {
    return !excludePatterns.some(pattern => {
      if (pattern.startsWith('_') && pattern.endsWith('.scss')) {
        return fileName.match(pattern.replace('*', '.*'))
      }
      return fileName === pattern
    })
  })
  
  console.log(`🎨 Precompiling ${scssFiles.length} SCSS files (${allScssFiles.length - scssFiles.length} skipped)...`)
  
  for (const fileName of scssFiles) {
    const scssPath = path.join(stylesDir, fileName)
    
    // 检查文件修改时间，避免重复编译未修改的文件
    const scssStats = fs.statSync(scssPath)
    const cssFileName = fileName.replace(/\.scss$/, '.css')
    const cssPath = path.join(rootDir, blogConfig.dist || 'docs', cssFileName)
    
    let needCompile = true
    
    // 如果CSS文件存在且比SCSS文件新，则跳过编译
    if (fs.existsSync(cssPath)) {
      const cssStats = fs.statSync(cssPath)
      if (cssStats.mtime > scssStats.mtime) {
        needCompile = false
        console.log(`⏭️  Skipping ${fileName} (CSS is newer)`)
      }
    }
    
    if (needCompile) {
      const success = compileSingleScssFile(scssPath, fileName, rootDir, blogConfig)
      if (success) {
        compiledScssCache.set(fileName, cssFileName)
      }
    } else {
      // 即使跳过编译，也要添加到缓存中
      compiledScssCache.set(fileName, cssFileName)
    }
  }
  
  console.log(`✅ SCSS precompilation completed, ${compiledScssCache.size} files cached`)
}
