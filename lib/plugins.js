var
CMDS     = require('command_runner'),
FilePath = require('filepath').FilePath,
INI      = require('ini'),
U        = require('./u'),
Promise  = require('./promise'),
log      = require('./log');


exports.initializers = function (seed) {
  var
  promise = Object.keys(exports.PLUGINS).reduce(function (promise, key) {
    var
    plugin = exports.PLUGINS[key];

    if (!U.isFunction(plugin.init)) {
      return promise;
    }

    return promise.then(plugin.init).then(function (res) {
      seed[key] = res;
      return seed;
    });
  }, Promise.cast(seed));
  return promise;
};


exports.api = function (seed) {
  return Object.keys(exports.PLUGINS).reduce(function (promise, key) {
    var
    plugin = exports.PLUGINS[key];

    if (U.isFunction(plugin.api)) {
      seed[key] = plugin.api;
    }

    return seed;
  }, seed);
};


var path = FilePath.create;
path.root = FilePath.root;
path.home = FilePath.home;


function shell(cmd, opts) {
  opts = opts || Object.create(null);

  log.info('shell command - %s', cmd);
  log.stdout('shell command: %s', cmd);

  return CMDS.exec(cmd).then(function (res) {
    var err;
    if (res.exitCode) {
      log.error('error - shell command - %s - %s', cmd, res.stderr);
      err = new Error('Shell command exec error');
      err.code = 'ESHELL_COMMAND';
      err.exitCode = res.exitCode;
    }
    if (!opts.silent && res.stdout) {
      log.stdout('stdout:');
      console.log(res.stdout);
    }
    if (!opts.silent && res.stderr) {
      log.stderr('stderr:');
      console.error(res.stderr);
    }
    if (err) {
      return Promise.reject(err);
    }
    return res;
  });
}


function git_config() {
  var
  path = FilePath.create().append('.git', 'config');
  return path.read().then(function (text) {
    if (!text) {
      return null;
    }
    return INI.parse(text);
  });
}


function read_ini(path) {
  path = FilePath.create(path);
  return path.read().then(function (text) {
    if (!text) {
      return null;
    }
    return INI.parse(text);
  });
}


exports.PLUGINS = {

  'path': {
    api: path
  },

  'shell': {
    api: shell
  },

  'read_ini': {
    api: read_ini
  },

  'git_config': {
    init: git_config
  }
};
