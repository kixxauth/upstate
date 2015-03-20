var
PLUGINS,

FilePath = require('filepath').FilePath,
INI      = require('ini'),
Promise  = require('./promise');


exports.initializers = function (seed) {
  var
  promise = Object.keys(PLUGINS).reduce(function (promise, key) {
    var
    plugin = PLUGINS[key];

    return promise.then(plugin.init).then(function (res) {
      seed[key] = res;
      return seed;
    });
  }, Promise.cast(seed));
  return promise;
};


PLUGINS = {

  'git_config': {

    init: function (seed) {
      var
      path = FilePath.create().append('.git', 'config');
      return path.read().then(function (text) {
        if (!text) {
          return null;
        }
        return INI.parse(text);
      });
    }
  }
};
