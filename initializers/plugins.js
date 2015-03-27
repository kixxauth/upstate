var
U       = require('../lib/u'),
Promise = require('../lib/promise');


exports.initialize = function (API, args) {
  var promises;

  API.U = U;
  API.Promise = Promise;

  promises = [
    require('../plugins/path').initialize(API, args),
    require('../plugins/shell').initialize(API, args),
    require('../plugins/ssh').initialize(API, args),
    require('../plugins/git_config').initialize(API, args),
    require('../plugins/templating').initialize(API, args)
  ];

  return Promise.all(promises);
};
