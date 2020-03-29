// eslint-disable-next-line import/no-extraneous-dependencies
const path = require('path')
const webpackMerge = require('webpack-merge')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const TerserJSPlugin = require('terser-webpack-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

// eslint-disable-next-line arrow-body-style
module.exports = (env) => {
  return webpackMerge({}, {
    mode: env,
    devtool: env === 'production' ? 'source-map' : 'inline-source-map',
    resolve: {
      alias: {
      },
      extensions: ['.js', '.ts', '.tsx', '.json'],
      modules: ['core', 'node_modules'],
    },
    entry: {
        index: path.resolve(__dirname, `../core/index.tsx`),
    },
    target: 'web',
    module: {
      rules: [
        // {
        //   test: /\.(png|jpg|jpeg|gif|md|svg)$/,
        //   include: [
        //     path.resolve(__dirname, '../core'),
        //   ],
        //   use: [
        //     {
        //       loader: 'file-loader',
        //       options: {
        //         outputPath: 'files',
        //       },
        //     },
        //   ],
        // },
        {
          test: /\.ts(x?)$/,
          include: [
            path.resolve(__dirname, '../core'),
          ],
          use: [
            {
              loader: 'awesome-typescript-loader',
            },
          ],
        },
        {
          test: /\.(css|scss)$/,
          use: [
            env === 'production' ? MiniCssExtractPlugin.loader : 'style-loader',
            {
              loader: 'css-loader',
              options: {
                url: false,
              },
            },
            'postcss-loader',
            {
              loader: 'sass-loader',
              options: {
                // eslint-disable-next-line quotes
                // data: ``,
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: path.resolve(__dirname, '../core/templates/index.html'),
        inject: 'body',
        title: '再见二丁目',
        chunks: ['index'],
        isProd: env === 'production',
      }),
      ...(env === 'production' ? [new MiniCssExtractPlugin({
        filename: 'css/[name].[hash].css',
      })] : []),
    ],
  }, env === 'production' ? {
    externals: {
      react: 'React',
      'react-dom': 'ReactDOM',
    },
    optimization: {
      minimize: true,
      minimizer: [new TerserJSPlugin(), new OptimizeCSSAssetsPlugin()],
    },
  } : {})
}
