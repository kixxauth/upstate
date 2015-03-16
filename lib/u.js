var
U;

module.exports = U = require('lodash');

U.mixin({

  execute: function (funcs) {
    var boundArgs = Array.prototype.slice.call(arguments, 1);
    return function() {
      var
      args,
      context = this;
      args = boundArgs.concat(Array.prototype.slice.call(arguments));
      return U.map(funcs, function (fn) {
        return fn.apply(context, args);
      });
    };
  }
});
