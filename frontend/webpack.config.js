const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  mode: isProduction ? 'production' : 'development',
  entry: {
    index: './build/index.js',
  },
  devtool: "source-map",
  output: {
    filename: '[name].[contenthash].js',
  },
	optimization: {
		minimize: isProduction,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: true,
          mangle: false,
        },
      }),
    ],
	},
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Semaphore UI',
    })
  ],
  externals: /^(worker_threads)$/,
  module: {
    rules: [
      {
        test: /\.less$/,
				include: [
					path.resolve(__dirname, "less/")
				],
        use: [
          'style-loader',
          'css-loader',
          'less-loader',
        ]
      },
    ],
  }
};
