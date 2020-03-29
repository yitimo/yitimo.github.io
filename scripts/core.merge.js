const fs = require('fs')
const path = require('path')
// const process = require('process')
// const execSync = require('child_process').execSync

console.log('此脚本为，yarn build了comment项目后，将生成的资源复制到jekyll的assets目录下，并注入到需要的_layouts中')

const jsDir = path.resolve(__dirname, '../dist-core/js')
const cssDir = path.resolve(__dirname, '../dist-core/css')
const targetDir = path.resolve(__dirname, '../assets/core')

rmrfSync(targetDir)
fs.mkdirSync(targetDir)

console.log('清理并初始化 asset/core')

const jsDOMStr = fs.readdirSync(jsDir).reduce((result, next) => {
    fs.copyFileSync(path.resolve(jsDir, `./${next}`), path.resolve(targetDir, `./${next}`))
    if (next.endsWith('.js')) {
        return result + `\t<script src="/assets/core/js/${next}"></script>\n`
    }
    return result
}, '')
const cssDOMStr = fs.readdirSync(cssDir).reduce((result, next) => {
    fs.copyFileSync(path.resolve(cssDir, `./${next}`), path.resolve(targetDir, `./${next}`))
    if (next.endsWith('.css')) {
        return result + `\t<link rel="stylesheet" href="/assets/core/css/${next}" />\n`
    }
    return result
}, '')

console.log('插入core资源至jekyll布局')

insertTag(path.resolve(__dirname, '../core/templates/post.html'), path.resolve(__dirname, '../_layouts/post.html'), jsDOMStr, 'body')
insertTag(path.resolve(__dirname, '../core/templates/post.html'), path.resolve(__dirname, '../_layouts/post.html'), cssDOMStr, 'head')
insertTag(path.resolve(__dirname, '../core/templates/home.html'), path.resolve(__dirname, '../_layouts/home.html'), jsDOMStr, 'body')
insertTag(path.resolve(__dirname, '../core/templates/home.html'), path.resolve(__dirname, '../_layouts/home.html'), cssDOMStr, 'head')

console.log('清理core-dist')

rimraf(path.resolve(__dirname, '../dist-core'))

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

function rmrfSync(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file, index) {
            var curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
}

/**
 * 
 * @param {string} file 目标文件路径
 * @param {string} content 插入内容
 * @param {'head'|'body'} position 插入位置
 */
function insertTag(sourcefile, targetFile, content, position) {
    let origin = fs.readFileSync(sourcefile).toString()
    const indexToInsert = origin.indexOf(position === 'head' ? '</head>' : '</body>')
    origin = origin.substring(0, indexToInsert) + content + origin.substring(indexToInsert, origin.length)
    fs.writeFileSync(targetFile, origin)
}
