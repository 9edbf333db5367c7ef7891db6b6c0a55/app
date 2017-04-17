var path = require('path');

module.exports = {
  entry: './app/scripts/main.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'build/www')
  },
};
