var
UTIL     = require('util'),
FilePath = require('filepath').FilePath,
COLORS   = require('colors'),
Promise  = require('../lib/promise');

exports.initialize = function (API, args) {
  debugger;
  return newLogger({
      directory : args.logDirectory,
      filename  : args.logFilename || 'upstate'
    }).then(function (log) {
      API.log = log;
      return API;
    });
};

function newLogger(spec) {
  return new Promise(function (resolve, reject) {
    var
    api = Object.create(null),
    directory,
    fileStream;

    try {
      if (spec.directory && spec.filename) {
        directory = FilePath.create(spec.directory);
        if (!directory.exists()) {
          directory.mkdir();
        }
        fileStream = directory
          .append(spec.filename)
          .newWriteStream({
            flags: 'a'
          });
      }
    } catch (err) {
      return reject(err);
    }

    api.info = function () {
      var str = UTIL.format.apply(UTIL, arguments);
      fileStream.write('INFO - '+ timestamp() +' - '+ str +'\n');
    };

    api.error = function () {
      var str = UTIL.format.apply(UTIL, arguments);
      fileStream.write('ERROR - '+ timestamp() +' - '+ str +'\n');
    };

    api.stdout = function () {
      var str = UTIL.format.apply(UTIL, arguments);
      console.log(COLORS.green(str));
    };

    api.stderr = function () {
      var str = UTIL.format.apply(UTIL, arguments);
      console.error(COLORS.red(str));
    };

    function timestamp() {
      var
      now = new Date(),
      tzo = -now.getTimezoneOffset(),
      dif = tzo >= 0 ? '+' : '-',
      pad = function(num) {
        var norm = Math.abs(Math.floor(num));
        return (norm < 10 ? '0' : '') + norm;
      };
      return now.getFullYear()
        + '-' + pad(now.getMonth()+1)
        + '-' + pad(now.getDate())
        + 'T' + pad(now.getHours())
        + ':' + pad(now.getMinutes())
        + ':' + pad(now.getSeconds())
        + dif + pad(tzo / 60);
    }

    fileStream.on('open', function () {
      return resolve(api);
    });
  });
}
