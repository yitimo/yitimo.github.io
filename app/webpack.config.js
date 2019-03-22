const path = require("path");

const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    mode: "production",
    entry: {
        "app": "./app/App.tsx"
    },
    output: {
        filename: "[name].[hash].bundle.js",
        path: path.resolve(__dirname, "..", "assets/js"),
        publicPath: "/assets/js/"
    },
    devtool: "source-map",
    resolve: {
        extensions: [
            ".tsx", ".jsx", ".ts", ".js", ".json"
        ]
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "awesome-typescript-loader",
                options: {
                    configFileName: "app/tsconfig.json"
                }
            },
            {
                enforce: "pre",
                test: /\.js$/,
                loader: "source-map-loader"
            },
            {
                test: /\.scss$/,
                use: [{
                    loader: "style-loader",
                    options: {
                        sourceMap: false
                    }
                }, {
                    loader: "css-loader",
                    options: {
                        sourceMap: false
                    }
                }, {
                    loader: "sass-loader",
                    options: {
                        sourceMap: false,
                        includePaths: [
                            require('path').resolve(__dirname, "..", "node_modules")
                        ]
                    }
                }]
            }
        ]
    },
    optimization: {
        splitChunks: {
            chunks: 'all',
            minSize: 30000,
            maxSize: 0,
            minChunks: 1,
            maxAsyncRequests: 5,
            maxInitialRequests: 3,
            automaticNameDelimiter: '~',
            name: true,
            cacheGroups: {
                vendors: {
                    test: /[\\/]node_modules[\\/]/,
                    priority: -10
                },
                default: {
                    minChunks: 2,
                    priority: -20,
                    reuseExistingChunk: true
                }
            }
        }
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: "../../_includes/nav.html",
            template: "./app/index.html",
            chunks: "all",
            minify: true
        })
    ]
};
