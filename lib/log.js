var
UTIL   = require('util'),
COLORS = require('colors');

exports.info = console.log;
exports.error = console.error;

exports.stdout = function () {
  var str = UTIL.format.apply(UTIL, arguments);
  console.log(COLORS.green(str));
};

exports.stderr = function () {
  var str = UTIL.format.apply(UTIL, arguments);
  console.error(COLORS.red(str));
};
