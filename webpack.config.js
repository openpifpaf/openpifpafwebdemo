module.exports = [

// for output to openpifpafwebdemo/static/frontend.js
{
  mode: 'development',
  context: __dirname,
  entry: {
    openpifpafwebdemo: './js/src/frontend.ts',
  },
  output: {
    path: __dirname,
    library: 'openpifpafwebdemo',
    libraryTarget: 'umd',
    filename: 'openpifpafwebdemo/static/frontend.js',
  },

  devtool: 'source-map',

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },

  module: {
    rules: [
      { test: /\.jsx?$/, loader: 'babel-loader' },
      { test: /\.tsx?$/, loader: 'awesome-typescript-loader' },
      { enforce: 'pre', test: /\.js$/, loader: 'source-map-loader' }
    ]
  },
},

// for output to openpifpafwebdemo/static/clientside.js
{
  mode: 'development',
  context: __dirname,
  entry: {
    openpifpafwebdemo: './js/src/clientside.ts',
  },
  output: {
    path: __dirname,
    library: 'openpifpafwebdemo',
    libraryTarget: 'umd',
    filename: 'openpifpafwebdemo/static/clientside.js',
  },

  devtool: 'source-map',

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },

  module: {
    rules: [
      { test: /\.jsx?$/, loader: 'babel-loader' },
      { test: /\.tsx?$/, loader: 'awesome-typescript-loader' },
      { enforce: 'pre', test: /\.js$/, loader: 'source-map-loader' }
    ]
  },
},

];
