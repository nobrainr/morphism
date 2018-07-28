const webpack = require('webpack');
const path = require('path');
const DashboardPlugin = require('webpack-dashboard/plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';
const isTest = nodeEnv === 'test';

const plugins = [
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
    app: './morphism.ts'
  },
  output: {
    path: path.resolve('./dist'),
    filename: 'morphism.js',
    library: 'morphism',
    libraryTarget: 'commonjs-module',
    sourceMapFilename: 'morphism.map',
    devtoolModuleFilenameTemplate: function(info) {
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
      isTest
        ? {
            test: /\.(js|ts)$/,
            loader: 'istanbul-instrumenter-loader',
            exclude: [/\/node_modules\//],
            query: {
              esModules: true
            }
          }
        : null
    ].filter(Boolean)
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
