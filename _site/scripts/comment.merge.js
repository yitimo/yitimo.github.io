const fs = require('fs')
const path = require('path')
const process = require('process')
const execSync = require('child_process').execSync

// TODO: 此脚本为，yarn build了comment项目后，将生成的资源复制到jekyll的assets目录下，并注入到需要的_layouts中

console.log('此脚本为，yarn build了comment项目后，将生成的资源复制到jekyll的assets目录下，并注入到需要的_layouts中')

const jsDir = fs.readdirSync(path.resolve(__dirname, '../comment/build/static/js'))
const cssDir = fs.readdirSync(path.resolve(__dirname, '../comment/build/static/css'))

rmrfSync(path.resolve(__dirname, '../assets/comment'))
fs.mkdirSync(path.resolve(__dirname, '../assets/comment'))

const jsDOMStr = jsDir.reduce((result, next) => {
    fs.copyFileSync(path.resolve(__dirname, `../comment/build/static/js/${next}`), path.resolve(__dirname, `../assets/comment/${next}`))
    if (next.endsWith('.js')) {
        return result + `\t<script src="/assets/comment/${next}"></script>\n`
    }
    return result
}, '')
const cssDOMStr = cssDir.reduce((result, next) => {
    fs.copyFileSync(path.resolve(__dirname, `../comment/build/static/css/${next}`), path.resolve(__dirname, `../assets/comment/${next}`))
    if (next.endsWith('.css')) {
        return result + `\t<link rel="stylesheet" href="/assets/comment/${next}" />\n`
    }
    return result
}, '')

let originLayoutPost = fs.readFileSync(path.resolve(__dirname, '../comment/public/post.html')).toString()
const indexOfBodyEnd = originLayoutPost.indexOf('</body>')
originLayoutPost = originLayoutPost.substring(0, indexOfBodyEnd) + jsDOMStr + originLayoutPost.substring(indexOfBodyEnd, originLayoutPost.length)
const indexOfHeadEnd = originLayoutPost.indexOf('</head>')
originLayoutPost = originLayoutPost.substring(0, indexOfHeadEnd) + cssDOMStr + originLayoutPost.substring(indexOfHeadEnd, originLayoutPost.length)

fs.writeFileSync(path.resolve(__dirname, '../_layouts/post.html'), originLayoutPost)

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
