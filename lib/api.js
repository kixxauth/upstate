var

U       = require('./u'),
Plugins = require('./Plugins');

exports.createAPI = function () {
  var
  api = Plugins.api(Object.create(null));
  api.U = U;
  return Object.freeze(api);
};
