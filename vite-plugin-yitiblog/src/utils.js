// 日期格式化工具
/**
 * 格式化日期
 * @param {string|Date} date 日期
 * @param {string} format 格式化字符串
 * @returns {string} 格式化后的日期
 */
export function formatDate(date, format = '%Y-%m-%d') {
  if (!date) return ''
  if (!format) format = '%Y-%m-%d'
  
  const d = new Date(date)
  const formatMap = {
    '%Y': d.getFullYear(),
    '%m': String(d.getMonth() + 1).padStart(2, '0'),
    '%d': String(d.getDate()).padStart(2, '0'),
    '%H': String(d.getHours()).padStart(2, '0'),
    '%M': String(d.getMinutes()).padStart(2, '0'),
    '%b': d.toLocaleDateString('en', { month: 'short' }),
    '%s': Math.floor(d.getTime() / 1000) // Unix timestamp
  }
  
  let result = format
  for (const [key, value] of Object.entries(formatMap)) {
    result = result.replace(key, value)
  }
  return result
}
