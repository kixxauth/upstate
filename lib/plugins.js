var
PLUGINS,

CMDS     = require('command_runner'),
FilePath = require('filepath').FilePath,
INI      = require('ini'),
U        = require('./u'),
Promise  = require('./promise'),
log      = require('./log');


exports.initializers = function (seed) {
  var
  promise = Object.keys(PLUGINS).reduce(function (promise, key) {
    var
    plugin = PLUGINS[key];

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
  return Object.keys(PLUGINS).reduce(function (promise, key) {
    var
    plugin = PLUGINS[key];

    if (U.isFunction(plugin.api)) {
      seed[key] = plugin.api;
    }

    return seed;
  }, seed);
};


var path = FilePath.create;
path.root = FilePath.root;
path.home = FilePath.home;


PLUGINS = {

  'path': {
    api: FilePath.create
  },

  'shell': {
    api: shell
  },

  'git_config': {
    init: getGitConfig
  }
};


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
      return Promise.reject(err);
    }
    if (!opts.silent && res.stdout) {
      log.stdout('stdout:');
      console.log(res.stdout);
    }
    if (!opts.silent && res.stderr) {
      log.stdout('stderr:');
      console.error(res.stderr);
    }
    return res;
  });
}


function getGitConfig() {
  var
  path = FilePath.create().append('.git', 'config');
  return path.read().then(function (text) {
    if (!text) {
      return null;
    }
    return INI.parse(text);
  });
}

