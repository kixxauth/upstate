var
U       = require('./u'),
Objects = require('./objects');


exports.newSubTask = Objects.factory({

  initialize: function (spec) {
    Object.defineProperties(this, {
      id: {
        enumerable: true,
        value: spec.id
      },
      callable: {
        value: spec.callable
      }
    });
  },

  run: function (api, args) {
    return this.callable.call(null, api, args);
  }
});
