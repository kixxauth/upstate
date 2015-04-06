var
FilePath = require('filepath').FilePath,
INI      = require('ini'),
Objects  = require('./objects'),
Action   = require('./action').Action;


exports.newConfigLoader = Objects.factory([Action], {

  initialize: function () {
    this.q(this.loadConfigs);
    this.q(this.loadUserData);
  },

  loadConfigs: function (args) {
    return readIni(args.configPath).then(function (config) {
      args.config = transformData(args.environment, config || Object.create(null));
      return args;
    });
  },

  loadUserData: function (args) {
    args.userDataPath = (args.config.paths || {}).user_data;
    if (args.userDataPath) {
      args.userDataPath = args.userDataPath.replace(/^\~/, FilePath.home().toString());
      return readIni(args.userDataPath).then(function (userData) {
          if (userData) {
            args.user_data = transformData(args.environment, userData);
          } else {
            args.user_data = userData;
          }
          return args;
        });
    }
    args.user_data = null;
    return args;
  }
});


function readIni(path) {
  path = FilePath.create(path);
  return path.read().then(function (text) {
    if (!text) {
      return null;
    }
    return INI.parse(text);
  });
};


function transformData(environment, data) {
  return Object.keys(data).reduce(function (rv, key) {
    var
    val = (data[key] || {})[environment];
    Object.defineProperty(rv, key, {
      enumerable: true,
      value: typeof val === 'undefined' ? data[key] : val
    });
    return rv;
  }, Object.create(null));
}
