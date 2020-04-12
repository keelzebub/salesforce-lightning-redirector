const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    popup: './src/popup.js',
    background: './src/background.js',
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        include: [
          path.resolve(__dirname, './src'),
        ],
        use: [
          'style-loader',
          'css-loader',
          'sass-loader',
        ],
      },
      {
        test: /\.js$/,
        include: [
          path.resolve(__dirname, './src'),
        ],
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-transform-react-jsx'],
          },
        },
      },
    ],
  },
  plugins: [
    new CopyPlugin([
      {
        from: path.resolve(__dirname, './src/manifest.json'),
        to: path.resolve(__dirname, './build/manifest.json'),
      },
      {
        from: path.resolve(__dirname, './src/popup.html'),
        to: path.resolve(__dirname, './build/popup.html'),
      },
      {
        from: path.resolve(__dirname, './src/assets'),
        to: path.resolve(__dirname, './build/assets'),
      },
    ]),
  ],
};