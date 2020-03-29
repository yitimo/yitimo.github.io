// 根据传入参数指定打包各页面或所有页面

const path = require('path')
const fs = require('fs')
const chalk = require('chalk')
const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const webpackMerge = require('webpack-merge')
const generateWebpackConfig = require('./webpack.config')

const command = process.argv[2]
const host = '0.0.0.0'
const port = 9990

console.log(`执行的命令是: ${command}`)

switch (command) {
    case 'serve':
        servePages()
        break
    case 'build':
        buildPages()
        break
    default:
        console.error(`未知指令: ${command}\n支持的指令有:\n\tserve: 开发页面\n\tbuild: 编译页面`)
        process.exit(0)
}

function servePages() {
    const config = webpackMerge(generateWebpackConfig('development'), {})
    const webpackInstance = webpack(config)
    webpackInstance.hooks.beforeCompile.tap('Compile', () => {
        process.stdout.write("\r\x1b[K")
        process.stdout.write('[development]正在编译...')
    })
    webpackInstance.hooks.afterCompile.tap('Compile', () => {
        process.stdout.write("\r\x1b[K")
        process.stdout.write('[development]编译完成')
    })
    const devServer = new WebpackDevServer(webpackInstance, {
        quiet: true,
    })
    devServer.listen(port, host, () => {
        notifyResult()
    })
}

function buildPages() {
    const config = webpackMerge(generateWebpackConfig('production'), {
        output: {
            filename: 'js/[name].[hash].js',
            chunkFilename: 'js/[name].vendor.js',
            hashDigestLength: 8,
            path: path.resolve(__dirname, '../dist-core'),
            publicPath: '/assets/core/',
        },
    })
    const webpackInstance = webpack(config)
    webpackInstance.hooks.beforeCompile.tap('Compile', () => {
        process.stdout.write("\r\x1b[K")
        process.stdout.write('[production]正在编译...')
    })
    webpackInstance.hooks.afterCompile.tap('Compile', () => {
        process.stdout.write("\r\x1b[K")
        process.stdout.write('[production]编译完成')
    })
    webpackInstance.run(() => {
        notifyResult()
    })
}

function notifyResult() {
    /* ================开发环境提示信息================ */
    // if (process.env.NODE_ENV) {
    // const num = Math.ceil(Math.random() * 5)
    // const key = ['red', 'blue', 'green', 'yellow', 'cyan', 'white'][num]
    // console.clear()
    console.log(chalk.blue('> Developers: ', 'yitimo'))
    // })
    if (command === 'serve') {
        console.log(`http://${host}:${port}`)
    }
    // }
    /* ================开发环境提示信息================ */
}
