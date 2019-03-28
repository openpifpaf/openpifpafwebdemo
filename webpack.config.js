module.exports = [

// for output to static/analysis.js
{
  mode: 'production',
  context: __dirname,
  entry: {
    openpifpafwebdemo: './js/src/frontend.ts',
  },
  output: {
    path: __dirname,
    library: 'openpifpafwebdemo',
    libraryTarget: 'umd',
    filename: 'static/analysis.js',
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

// for output to openpifpafwebdemo/analysis.js
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
    filename: 'openpifpafwebdemo/analysis.js',
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
}

];
