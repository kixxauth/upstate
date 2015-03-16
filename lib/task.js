
var
Promise = require('iou').Promise,
_       = require('lodash'),
log     = require('./log');


exports.Task = {

  before: function (name, fn) {
    var
    self = this,
    errorHandler = this.errorHandler('before : '+ this.id +' : '+ name);

    this.runBefore.push(function (data) {
      log.info('before - %s - %s', self.id, name);
      return Promise.cast(fn(data))
        .then(_.constant(data), errorHandler);
    });
  },

  after: function (name, fn) {
    var
    self = this,
    errorHandler = this.errorHandler('after : '+ this.id +' : '+ name);

    this.runAfter.push(function (data) {
      log.info('after - %s - %s', self.id, name);
      return Promise.cast(fn(data))
        .then(_.constant(data), errorHandler);
    });
  },

  run: function (taskRunner, data) {
    var
    list = this.runBefore
      .concat(this.bindDependencies())
      .concat(this.bindCallable())
      .concat(this.runAfter);
    return list.reduce(function (promise, fn) {
      return promise.then(fn);
    }, Promise.cast(data));
  },

  bindDependencies: function () {
    var self = this;
    return this.dependencies.map(function (id) {
      return self.taskRunner.getTask(id).bindCallable(self.id);
    });
  },

  bindCallable: function (dependent) {
    var
    self = this,
    fn,
    errorHandler = this.errorHandler('task : '+ this.id);

    fn = function (data) {
      if (dependent) {
        log.info('task as dependency - %s %s', dependent, self.id);
        log.stdout('Running task as dependency %s : %s', dependent, self.id);
      } else {
        log.info('task - %s', self.id);
        log.stdout('Running task %s', self.id);
      }
      return Promise.cast(self.callable.call(null, data))
        .then(_.constant(data), errorHandler);
    };
    return fn;
  },

  errorHandler: function (msg) {
    return function (err) {
      var
      stack = (err || {}).stack || 'No stack trace';
      log.error('error - %s - %s', msg, stack);
      log.stderr('Error: %s', msg);
      log.stderr(stack);
      return Promise.reject(err);
    };
  },

  create: function (spec) {
    spec = spec || Object.create(null);
    var err;
    if (!spec.id || typeof spec.id !== 'string') {
      err = new Error("A Task requires a String id property.");
      err.code = 'ETASK_REQUIRE_ID';
      throw err;
    }
    if (typeof spec.callable !== 'function') {
      err = new Error("A Task requires a Function callable property.");
      err.code = 'ETASK_REQUIRE_CALLABLE';
      throw err;
    }
    var self = Object.create(exports.Task);
    Object.defineProperties(self, {
      id: {
        enumerable: true,
        value: spec.id
      },
      dependencies: {
        value: spec.dependencies
      },
      callable: {
        value: spec.callable
      },
      runBefore: {
        value: []
      },
      runAfter: {
        value: []
      },
      taskRunner: {
        value: spec.taskRunner
      }
    });
    return self;
  }
};
