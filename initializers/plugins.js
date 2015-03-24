var
CMDS     = require('command_runner'),
FilePath = require('filepath').FilePath,
INI      = require('ini'),
U        = require('./u'),
Promise  = require('./promise'),
SSH      = require('./ssh'),
TPL      = require('./templating');


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

exports.api = function (seed, conf) {
  var
  promise = Object.keys(exports.PLUGINS).reduce(function (promise, key) {
    var
    plugin = exports.PLUGINS[key];

    if (!U.isFunction(plugin.api)) {
      return promise;
    }

    return promise.then(plugin.api).then(function (res) {
      seed[key] = res;
      return seed;
    });
  }, Promise.cast(conf));
  return promise;
};


function path(conf) {
  var path = FilePath.create;
  path.root = FilePath.root;
  path.home = FilePath.home;
  path.expand = function (filepath) {
    return path(filepath.toString().replace(/^\~/, FilePath.home().toString()));
  };
  return path;
}


function shell(conf) {
  var
  log = conf.log;

  return function (cmd, opts) {
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
  };
};


function sftp_put(conf) {
  return function (args) {
    var
    promise,
    connection,
    host = args.host,
    username = args.username,
    key = args.key,
    source = args.source,
    target = args.target;

    promise = SSH.newSSH({
        log : conf.log
      })
      .connect({
        host       : host,
        username   : username,
        privateKey : key
      })
      .then(function (cxn) {
        connection = cxn;
        return cxn.sftp();
      })
      .then(function (client) {
        return client.put({
          source : source,
          target : target
        });
      })
      .then(function () {
        connection.end();
      });
    return promise;
  };
}


function date_filename(conf) {
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


function read_ini(conf) {
  return function (path) {
    path = FilePath.create(path);
    return path.read().then(function (text) {
      if (!text) {
        return null;
      }
      return INI.parse(text);
    });
  };
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


exports.PLUGINS = {

  'path': {
    api: path
  },

  'shell': {
    api: shell
  },

  'ssh': {
    api: function (conf) {
      return function () {
        return SSH.newSSH({
          log : conf.log
        });
      };
    }
  },

  'sftp_put': {
    api: sftp_put
  },

  'template_path': {
    api: function (conf) {
      var
      log = conf.log;

      return function (path, data) {
        return TPL.renderPath(path, data).catch(function (err) {
          if (err.code === 'ENOTFOUND') {
            log.error('template_path - enotfound - %s', path +'');
            log.stderr('template_path: Path is not a file: %s', path +'');
          }
          return Promise.reject(err);
        });
      };
    }
  },

  'date_filename': {
    api: date_filename
  },

  'read_ini': {
    api: read_ini
  },

  'git_config': {
    init: git_config
  }
};
