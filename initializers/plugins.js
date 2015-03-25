var
Promise = require('../lib/promise');


exports.initialize = function (API, args) {
  var
  promises = [
    require('../plugins/path').initialize(API, args),
    require('../plugins/shell').initialize(API, args),
    require('../plugins/ssh').initialize(API, args),
    require('../plugins/git_config').initialize(API, args),
    require('../plugins/templating').initialize(API, args)
  ];

  return Promise.all(promises);
};
