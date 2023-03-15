module.exports = [

// for output to openpifpafwebdemo/static/frontend.js
{
  mode: 'development',
  context: __dirname,
  entry: {
    openpifpafwebdemo: './js/src/frontend.cts',
  },
  output: {
    path: __dirname,
    library: 'openpifpafwebdemo',
    filename: 'openpifpafwebdemo/static/frontend.js',
  },

  devtool: 'source-map',

  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    extensionAlias: {
     ".js": [".js", ".ts"],
     ".cjs": [".cjs", ".cts"],
     ".mjs": [".mjs", ".mts"]
    }
  },

  module: {
    rules: [
      { test: /\.([cm]?ts|tsx)$/, loader: "ts-loader" },
      { enforce: 'pre', test: /\.js$/, loader: 'source-map-loader' }
    ]
  },
},

// for output to openpifpafwebdemo/static/clientside.js
{
  mode: 'development',
  context: __dirname,
  entry: {
    openpifpafwebdemo: './js/src/clientside.cts',
  },
  output: {
    path: __dirname,
    library: 'openpifpafwebdemo',
    filename: 'openpifpafwebdemo/static/clientside.js',
  },

  devtool: 'source-map',

  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    extensionAlias: {
     ".js": [".js", ".ts"],
     ".cjs": [".cjs", ".cts"],
     ".mjs": [".mjs", ".mts"]
    }
  },

  module: {
    rules: [
      { test: /\.([cm]?ts|tsx)$/, loader: "ts-loader" },
      { enforce: 'pre', test: /\.js$/, loader: 'source-map-loader' }
    ]
  },
},

];
