// 配置管理模块
import fs from 'fs'
import path from 'path'

/**
 * 加载博客配置
 * @param {string} rootDir 
 * @returns {object}
 */
export function loadBlogConfig(rootDir) {
  const configPath = path.join(rootDir, 'yitiblog.json')
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  }
  return {}
}
