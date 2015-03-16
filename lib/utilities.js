
exports.delay = function (ms) {
  return function (values) {
    return new Promise(function (resolve) {
      setTimeout(function () {
        return resolve(values);
      }, ms);
    });
  };
};
