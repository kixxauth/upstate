var
_         = require('lodash'),
utilities = require('./utilities'),
shell     = require('./shell');


exports.properties = _.extend(Object.create(null), {
  _        : _,
  log      : require('./log'),
  delay    : utilities.delay,
  FilePath : require('filepath').FilePath,
  shell    : shell.shell,
  ssh      : require('./ssh')
});

exports.Api = {

  setProperties: function (props) {
    Object.keys(props).reduce(function (self, key) {
      Object.defineProperty(self, key, {
        enumerable: true,
        value: props[key]
      });
      return self;
    }, this);
    return this;
  },

  task: function (id, dependencies, fn) {
    if (typeof dependencies === 'function') {
      fn = dependencies;
      dependencies = [];
    }
    this.taskRunner.task(id, dependencies, fn);
    return this;
  },

  create: function (spec) {
    var self = Object.create(exports.Api);
    this.setProperties(exports.properties);
    Object.defineProperties(self, {
      taskRunner: {
        value: spec.taskRunner
      }
    });
    return self;
  },

  retval: function (val) {
    return function () {
      return val;
    };
  }
};
