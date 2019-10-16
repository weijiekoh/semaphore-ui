const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  mode: 'development',
  entry: './build/index.js',
  devtool: "inline-source-map",
  output: {
    filename: '[name].[contenthash].js',
  },
	optimization: {
		minimize: false
	},
  plugins: [
    new HtmlWebpackPlugin()
  ]
};
