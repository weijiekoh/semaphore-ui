const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  mode: 'production',
  entry: './build/index.js',
  devtool: "inline-source-map",
  output: {
    filename: '[name].[contenthash].js',
  },
	optimization: {
		minimize: true
	},
  plugins: [
    new HtmlWebpackPlugin()
  ]
};
