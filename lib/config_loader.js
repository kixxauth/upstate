var
FilePath = require('filepath').FilePath,
INI      = require('ini'),
Objects  = require('./objects'),
Action   = require('./action').Action;


exports.newConfigLoader = Objects.factory([Action], {

  initialize: function () {
    this.q(this.loadConfigs);
    this.q(this.checkConfigs);
    this.q(this.loadUserData);
    this.q(this.checkUserData);
  },

  loadConfigs: function (args) {
    return readIni(args.configPath).then(function (config) {
      args.config = transformData(args.environment, config || Object.creat(null));
      return args;
    });
  },

  checkConfigs: function (args) {
    var
    err,
    configPath = args.configPath.toString();

    if (!args.config.project_name) {
      console.error('Missing project_name in %s', configPath);
      err = new Error('Missing project_name definition in config file.');
      err.code = 'ECONFIG';
      throw err;
    }
  },

  loadUserData: function (args) {
    var
    filepath = (args.config.paths || {}).user_data;
    if (filepath) {
      filepath = filepath.replace(/^\~/, FilePath.home().toString());
      return readIni(filepath).then(function (userData) {
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
  },

  checkUserData: function (args) {
    var err;
    if (!args.user_data) {
      console.error('User data file not found at %s', filepath);
      err = new Error('Invalid paths.user_data definition in config file.');
      err.code = 'ECONFIG';
      return Promise.reject(err);
    }
  },
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
