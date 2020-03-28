const webpackMerge = require('webpack-merge')

module.exports = webpackMerge({}, {
    devtool: 'inline-source-map',
    module: {
        rules: [
            {

            },
        ],
    },
})
