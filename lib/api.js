var

U = require('./u');

exports.createAPI = function () {
  return Object.defineProperties(Object.create(null), {
    U: {
      enumerable: true,
      value: U
    }
  });
};
