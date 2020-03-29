const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')
// const process = require('process')
// const execSync = require('child_process').execSync

console.log('开始发布到jekyll')

const jsDir = path.resolve(__dirname, '../dist-core/js')
const cssDir = path.resolve(__dirname, '../dist-core/css')
const targetDir = path.resolve(__dirname, '../assets/core')

rimraf.sync(targetDir)
fs.mkdirSync(path.resolve(targetDir, `./js`), {recursive: true})
fs.mkdirSync(path.resolve(targetDir, `./css`), {recursive: true})

console.log('清理并初始化 asset/core')

const jsDOMStr = fs.readdirSync(jsDir).reduce((result, next) => {
    fs.copyFileSync(path.resolve(jsDir, `./${next}`), path.resolve(targetDir, `./js/${next}`))
    if (next.endsWith('.js')) {
        return result + `\t<script defer src="/assets/core/js/${next}"></script>\n`
    }
    return result
}, '')
const cssDOMStr = fs.readdirSync(cssDir).reduce((result, next) => {
    fs.copyFileSync(path.resolve(cssDir, `./${next}`), path.resolve(targetDir, `./css/${next}`))
    if (next.endsWith('.css')) {
        return result + `\t<link rel="stylesheet" href="/assets/core/css/${next}" />\n`
    }
    return result
}, '')

console.log('插入core资源至jekyll布局')

insertTag(
    path.resolve(__dirname, '../core/templates/post.html'),
    path.resolve(__dirname, '../_layouts/post.html'),
    [
        {content: jsDOMStr, position: 'body'},
        {content: cssDOMStr, position: 'head'}
    ]
)
insertTag(
    path.resolve(__dirname, '../core/templates/home.html'),
    path.resolve(__dirname, '../_layouts/home.html'),
    [
        {content: jsDOMStr, position: 'body'},
        {content: cssDOMStr, position: 'head'}
    ]
)

console.log('清理core-dist')

rimraf.sync(path.resolve(__dirname, '../dist-core'))

console.log('成功发布react脚本到jekyll')

// let originLayoutPost = fs.readFileSync(path.resolve(__dirname, '../core/templates/post.html')).toString()
// const indexOfBodyEnd = originLayoutPost.indexOf('</body>')
// originLayoutPost = originLayoutPost.substring(0, indexOfBodyEnd) + jsDOMStr + originLayoutPost.substring(indexOfBodyEnd, originLayoutPost.length)
// const indexOfHeadEnd = originLayoutPost.indexOf('</head>')
// originLayoutPost = originLayoutPost.substring(0, indexOfHeadEnd) + cssDOMStr + originLayoutPost.substring(indexOfHeadEnd, originLayoutPost.length)
// fs.writeFileSync(path.resolve(__dirname, '../_layouts/post.html'), originLayoutPost)

// const command = (process.argv || [])[2]
// const isBuild = ((process.argv || []).find((e) => e.indexOf('--build') > -1))
// const isCustomerTest = (process.argv || []).some((e) => e.indexOf('--customer-test') > -1)

// switch (command) {
//     case 'serve':
//         execSync(`cd ${path.resolve(__dirname, '../comment')} && yarn serve`)
//         break
//     case 'build':
//         execSync(`cd ${path.resolve(__dirname, '../comment')} && yarn build`)
//         break
//     case 'test':
//         throw 'Test command is completing...'
//     default:
//         throw 'Please specify a command: <build | serve | test>.'
// }

/**
 * 
 * @param {string} file 目标文件路径
 * @param {string} content 插入内容
 * @param {Array<{content: string, position: 'head'|'body'}>} data 插入位置
 */
function insertTag(sourcefile, targetFile, data) {
    fs.writeFileSync(targetFile, data.reduce((rs, next) => {
        const indexToInsert = rs.indexOf(next.position === 'head' ? '</head>' : '</body>')
        return rs.substring(0, indexToInsert) + next.content + rs.substring(indexToInsert, rs.length)
    }, fs.readFileSync(sourcefile).toString()))
}
