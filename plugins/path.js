var
FilePath = require('filepath').FilePath,
INI      = require('ini');


exports.initialize = function (API, args) {
  API.path = FilePath.create;
  API.path.root = FilePath.root;
  API.path.home = FilePath.home;
  API.path.datename = dateFileName;

  path.expand = function (filepath) {
    return FilePath.create(filepath.toString().replace(/^\~/, FilePath.home().toString()));
  };

  FilePath.prototype.appendDatename = function (ext) {
    var filename = dateFileName + ext;
    return FilePath.create(this.path, filename);
  };

  FilePath.prototype.readIni = function () {
    return this.read().then(function (text) {
      if (!text) {
        return null;
      }
      return INI.parse(text);
    });
  };

  return API;
};


function dateFileName(conf) {
  return function () {
    var
    now = new Date(),
    pad = function(num) {
      var norm = Math.abs(Math.floor(num));
      return (norm < 10 ? '0' : '') + norm;
    };
    return now.getFullYear()
      + '_' + pad(now.getMonth()+1)
      + '_' + pad(now.getDate())
      + 'T' + pad(now.getHours())
      + '.' + pad(now.getMinutes())
      + '.' + pad(now.getSeconds());
  };
}
