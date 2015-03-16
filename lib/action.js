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
    promise;
    values = values || Object.create(null);
    promise = this.actions.reduce(function (promise, fn) {
      return promise.then(fn);
    }, Promise.resolve(values));
    return promise.catch(this.onerror);
  },

  q: function (handler) {
    var
    context = this;

    if (!U.isFunction(handler)) {
      throw new Error("Action q()'d method must be a function.");
    }

    this.actions.push(function (values) {
      handler.call(context, values);
      return values;
    });
  },

  onerror: function (err) {
    return Promise.reject(err);
  }
};
