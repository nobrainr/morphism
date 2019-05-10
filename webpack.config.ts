import path from 'path';
import webpack from 'webpack';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import NodemonPlugin from 'nodemon-webpack-plugin';
import ModuleDependencyWarning from 'webpack/lib/ModuleDependencyWarning';

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

class IgnoreNotFoundExportPlugin {
  apply(compiler) {
    const messageRegExp = /export '.*'( \(reexported as '.*'\))? was not found in/;
    function doneHook(stats) {
      stats.compilation.warnings = stats.compilation.warnings.filter(function(warn) {
        if (warn instanceof ModuleDependencyWarning && messageRegExp.test(warn.message)) {
          return false;
        }
        return true;
      });
    }
    if (compiler.hooks) {
      compiler.hooks.done.tap('IgnoreNotFoundExportPlugin', doneHook);
    } else {
      compiler.plugin('done', doneHook);
    }
  }
}

const webpackconfiguration: webpack.Configuration = {
  entry: path.resolve(__dirname, 'src', 'morphism.ts'),
  devtool: isProd ? 'hidden-source-map' : 'source-map',
  output: {
    filename: 'morphism.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'umd',
    globalObject: 'this',
    sourceMapFilename: 'morphism.map',
    library: 'Morphism'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json']
  },
  module: {
    rules: [{ test: /\.(ts|js)x?$/, use: ['babel-loader', 'source-map-loader'], exclude: /node_modules/ }]
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin({
      async: false,
      checkSyntacticErrors: true,
      reportFiles: ['**', '!**/*.json', '!**/__tests__/**', '!**/?(*.)(spec|test).*'],
      watch: './src',
      silent: true
    }),
    new NodemonPlugin(),
    new IgnoreNotFoundExportPlugin()
  ]
};

export default webpackconfiguration;
