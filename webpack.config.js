const webpack = require('webpack');
const path = require('path');
const DashboardPlugin = require('webpack-dashboard/plugin');
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

const plugins = [
    new UglifyJsPlugin({
        parallel: true,
        uglifyOptions: {
          ie8: false,
          ecma: 6,
          warnings: true,
          mangle: isProd, // debug false
          output: {
            comments: false,
            beautify: !isProd,  // debug true
          }
        },
        sourceMap: true
    }),
    new webpack.LoaderOptionsPlugin({
        options: {
            tslint: {
                emitErrors: true,
                failOnHint: true
            }
        }
    })
];

if (!isProd) {
    plugins.push(new DashboardPlugin());
}

var config = {
    devtool: isProd ? 'hidden-source-map' : 'source-map',
    context: path.resolve('./src'),
    entry: {
        app: './index.ts'
    },
    output: {
        path: path.resolve('./dist'),
        filename: 'morphism.js',
        library: 'morphism',
        libraryTarget: 'commonjs-module',
        sourceMapFilename: 'morphism.map',
        devtoolModuleFilenameTemplate: function (info) {
            return 'file:///' + info.absoluteResourcePath;
        }
    },
    module: {
        rules: [
            {
                enforce: 'pre',
                test: /\.ts?$/,
                exclude: ['node_modules'],
                use: ['awesome-typescript-loader', 'source-map-loader']
            },
            {
                test: /\.(js|ts)$/,
                loader: 'istanbul-instrumenter-loader',
                exclude: [/\/node_modules\//],
                query: {
                    esModules: true
                }
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    plugins: plugins,
    devServer: {
        contentBase: path.join(__dirname, 'dist/'),
        compress: true,
        port: 3000,
        hot: true
    }
};

module.exports = config;
