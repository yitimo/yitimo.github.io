// 资源处理模块
import fs from 'fs'
import path from 'path'

/**
 * 复制静态资源文件
 * @param {string} rootDir 项目根目录
 * @param {object} blogConfig 博客配置
 */
export function copyStaticAssets(rootDir, blogConfig) {
  const assetsDir = path.join(rootDir, 'assets')
  const outputDir = path.join(rootDir, blogConfig.dist || 'docs')
  const outputAssetsDir = path.join(outputDir, 'assets')
  
  if (!fs.existsSync(assetsDir)) {
    console.warn('assets directory not found')
    return
  }
  
  // 递归复制文件夹
  function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true })
    }
    
    const items = fs.readdirSync(src)
    
    for (const item of items) {
      const srcPath = path.join(src, item)
      const destPath = path.join(dest, item)
      const stat = fs.statSync(srcPath)
      
      if (stat.isDirectory()) {
        copyDir(srcPath, destPath)
      } else {
        fs.copyFileSync(srcPath, destPath)
      }
    }
  }
  
  copyDir(assetsDir, outputAssetsDir)
  console.log('Static assets copied to output directory')
}
