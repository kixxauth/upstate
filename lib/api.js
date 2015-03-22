var

U       = require('./u'),
Plugins = require('./Plugins');

exports.createAPI = function (spec) {
  var
  options = {
    log: spec.log
  };

  return Plugins.api(U.safeCopy(spec), options)
    .then(function (api) {
      api.U = U;
      return Object.freeze(api);
    });
};
