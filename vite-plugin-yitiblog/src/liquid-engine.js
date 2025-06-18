// Liquid模板引擎
import fs from 'fs'
import path from 'path'
import { formatDate } from './utils.js'
import { compileSingleScssFile } from './scss-compiler.js'

export class LiquidEngine {
  constructor(config, compiledScssCache) {
    this.config = config
    this.compiledScssCache = compiledScssCache
    
    this.filters = {
      date: (input, format) => {
        if (!input) return ''
        if (input === 'now') {
          input = new Date().toISOString()
        }
        return formatDate(input, format)
      },
      minus: (input, value) => {
        const num = parseInt(input) || 0
        const sub = parseInt(value) || 0
        return num - sub
      }
    }
  }

  // 解析变量路径 (如 post.title, site.posts)
  getValueByPath(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : ''
    }, obj)
  }

  // 处理过滤器 (如 {{ post.date | date:'%Y' }})
  applyFilter(value, filterString) {
    if (!filterString) return value

    // 支持链式过滤器，例如: date:'%s' | minus: 47304000
    const filters = filterString.split('|').map(s => s.trim())
    
    for (const filterStr of filters) {
      const filterMatch = filterStr.match(/(\w+)(?::\s*['"]?([^'"]*?)['"]?)?/)
      if (!filterMatch) continue

      const [, filterName, filterArg] = filterMatch
      const filter = this.filters[filterName]
      
      if (filter) {
        value = filter(value, filterArg)
      }
    }
    
    return value
  }

  // 渲染变量 {{ variable }}
  renderVariable(template, context) {
    return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, expression) => {
      const parts = expression.split('|').map(s => s.trim())
      const variablePath = parts[0]
      const filterString = parts[1]

      let value = this.getValueByPath(context, variablePath)
      
      if (filterString) {
        value = this.applyFilter(value, filterString)
      }

      return value || ''
    })
  }

  // 渲染for循环 {% for item in collection %}
  renderForLoop(template, context) {
    // 使用更智能的方法来匹配嵌套的for循环
    let result = template
    let changed = true
    
    // 持续处理直到没有更多for循环
    while (changed) {
      changed = false
      const forRegex = /\{\%\s*for\s+(\w+)\s+in\s+([^%]+)\s*\%\}/g
      let match
      
      while ((match = forRegex.exec(result)) !== null) {
        const [fullMatch, itemVar, collectionPath] = match
        const startIndex = match.index
        
        // 找到匹配的endfor，考虑嵌套情况
        let endIndex = this.findMatchingEndfor(result, startIndex)
        
        if (endIndex === -1) {
          continue // 没有找到匹配的endfor
        }
        
        const loopBody = result.substring(startIndex + fullMatch.length, endIndex)
        const collection = this.getValueByPath(context, collectionPath.trim())
        
        if (!Array.isArray(collection)) {
          // 移除整个for循环块
          result = result.substring(0, startIndex) + result.substring(endIndex + 12) // 12 = "{% endfor %}".length
          changed = true
          break
        }
        
        const renderedContent = collection.map(item => {
          // 创建新的上下文，包含循环变量
          const loopContext = { ...context, [itemVar]: item }
          
          // 递归处理循环体内的内容
          let processedBody = loopBody
          
          // 先处理嵌套的for循环
          processedBody = this.renderForLoop(processedBody, loopContext)
          
          // 再处理变量替换
          processedBody = this.renderVariable(processedBody, loopContext)
          
          return processedBody
        }).join('')
        
        // 替换整个for循环块
        result = result.substring(0, startIndex) + renderedContent + result.substring(endIndex + 12)
        changed = true
        break
      }
    }
    
    return result
  }
  
  // 找到匹配的endfor标签，考虑嵌套情况
  findMatchingEndfor(template, startIndex) {
    let depth = 1
    let index = startIndex
    
    // 跳过开始的for标签
    const forMatch = template.substring(index).match(/\{\%\s*for\s[^%]*\%\}/)
    if (forMatch) {
      index += forMatch[0].length
    }
    
    while (index < template.length && depth > 0) {
      const forMatch = template.substring(index).match(/\{\%\s*for\s/)
      const endforMatch = template.substring(index).match(/\{\%\s*endfor\s*\%\}/)
      
      let nextFor = forMatch ? index + forMatch.index : Infinity
      let nextEndfor = endforMatch ? index + endforMatch.index : Infinity
      
      if (nextFor < nextEndfor && nextFor < template.length) {
        // 找到嵌套的for循环
        depth++
        index = nextFor + forMatch[0].length
      } else if (nextEndfor < template.length) {
        // 找到endfor
        depth--
        if (depth === 0) {
          return nextEndfor
        }
        index = nextEndfor + endforMatch[0].length
      } else {
        break
      }
    }
    
    return -1 // 没有找到匹配的endfor
  }

  // 渲染include {% include filename %}
  renderInclude(template, includes, context = {}) {
    return template.replace(/\{\%\s*include\s+([^%]+)\s*\%\}/g, (match, filename) => {
      const cleanName = filename.replace('.html', '').trim()
      const includeContent = includes[cleanName] || ''
      
      // 对include的内容进行渲染，但不再递归处理includes以避免无限循环
      if (includeContent) {
        let result = includeContent
        
        // 处理capture语句
        result = this.renderCapture(result, context)
        
        // 处理if条件
        result = this.renderIf(result, context)
        
        // 处理for循环
        result = this.renderForLoop(result, context)
        
        // 处理变量替换
        result = this.renderVariable(result, context)
        
        return result
      }
      
      return ''
    })
  }

  // 渲染capture语句 {% capture variable %}content{% endcapture %}
  renderCapture(template, context) {
    return template.replace(/\{\%\s*capture\s+(\w+)\s*\%\}([\s\S]*?)\{\%\s*endcapture\s*\%\}/g, (match, varName, content) => {
      // 先处理capture内容
      let processedContent = content
      
      // 处理变量替换
      processedContent = this.renderVariable(processedContent, context)
      
      // 将结果存储到上下文中
      context[varName] = processedContent.trim()
      
      // capture语句本身不输出内容
      return ''
    })
  }

  // 渲染if条件语句
  renderIf(template, context) {
    return template.replace(/\{\%\s*if\s+([^%]+)\s*\%\}([\s\S]*?)(?:\{\%\s*else\s*\%\}([\s\S]*?))?\{\%\s*endif\s*\%\}/g, (match, condition, ifBody, elseBody = '') => {
      // 简单的条件判断实现
      const value = this.getValueByPath(context, condition.trim())
      
      if (value && value !== '' && value !== 0 && value !== false) {
        return this.render(ifBody, context)
      } else {
        return elseBody ? this.render(elseBody, context) : ''
      }
    })
  }

  // 渲染style语句 {% style filename.scss %}
  renderStyle(template, context, blogConfig) {
    return template.replace(/\{\%\s*style\s+([^%]+)\s*\%\}/g, (match, filename) => {
      const cleanName = filename.trim()
      
      try {
        // 首先检查缓存
        if (this.compiledScssCache.has(cleanName)) {
          const cssFileName = this.compiledScssCache.get(cleanName)
          return `<link rel="stylesheet" href="/${cssFileName}">`
        }
        
        // 如果缓存中没有，检查SCSS文件是否存在
        const scssPath = path.join(this.config.root, '_styles', cleanName)
        
        if (!fs.existsSync(scssPath)) {
          console.warn(`⚠️  SCSS file not found: ${scssPath}`)
          return `<!-- SCSS file not found: ${cleanName} -->`
        }
        
        // 尝试编译SCSS文件（这应该很少发生，因为我们已经预编译了）
        console.log(`⚠️  Compiling SCSS on-demand: ${cleanName} (consider adding to precompilation)`)
        const result = compileSingleScssFile(scssPath, cleanName, this.config.root, blogConfig)
        
        if (result) {
          // 生成CSS文件名并添加到缓存
          const cssFileName = cleanName.replace(/\.scss$/, '.css')
          this.compiledScssCache.set(cleanName, cssFileName)
          
          // 返回link标签
          return `<link rel="stylesheet" href="/${cssFileName}">`
        } else {
          return `<!-- Failed to compile SCSS: ${cleanName} -->`
        }
        
      } catch (error) {
        console.error(`❌ Error processing style tag for ${cleanName}:`, error.message)
        return `<!-- Error processing SCSS: ${cleanName} -->`
      }
    })
  }

  // 主渲染方法
  render(template, context, includes = {}, blogConfig = {}) {
    let result = template

    // 1. 首先处理style标签
    result = this.renderStyle(result, context, blogConfig)

    // 2. 处理includes
    result = this.renderInclude(result, includes, context)

    // 3. 处理capture语句
    result = this.renderCapture(result, context)

    // 4. 处理if条件
    result = this.renderIf(result, context)

    // 5. 处理for循环（从外层到内层）
    result = this.renderForLoop(result, context)

    // 6. 最后处理变量替换
    result = this.renderVariable(result, context)

    return result
  }
}
