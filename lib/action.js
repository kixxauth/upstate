var
Promise = require('./promise'),
U       = require('./u');


exports.Action = {

  initialize: function () {
    Object.defineProperties(this, {
      actions: {
        value : []
      }
    });
  },

  run: function (values) {
    var
    values = values || Object.create(null);
    return this.setReturns(this.reduce(values)).catch(this.onerror);
  },

  reduce: function (values) {
    return this.actions.reduce(function (promise, fn) {
      return promise.then(fn);
    }, Promise.cast(values));
  },

  setReturns: function (promise) {
    var
    returns = this.returns;

    return promise.then(function (values) {
      if (U.isFunction(returns)) {
        return returns(values);
      }
      if (U.isString(returns) || U.isNumber(returns)) {
        return values[returns];
      }
      return values;
    });
  },

  q: function (handler) {
    var
    context = this;

    if (!U.isFunction(handler)) {
      throw new Error("Action q()'d method must be a function.");
    }

    this.actions.push(function (values) {
      return Promise.cast(handler.call(context, values)).then(U.constant(values));
    });
  },

  onerror: function (err) {
    return Promise.reject(err);
  }
};
