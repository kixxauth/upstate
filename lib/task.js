var
U             = require('./u'),
Objects       = require('./objects'),
Action        = require('./action').Action,
EventEmitter  = require('./events').EventEmitter;


exports.validateSpec = function (spec) {
  var
  err;

  if (!spec.id || !U.isString(spec.id)) {
    err = new Error('A Task requires a String id property.');
    err.code = 'ETASK_REQUIRE_ID';
    throw err;
  }
  if (!U.isFunction(spec.init) && !spec.actions.length) {
    err = new Error('A task requires at least one q action or an init method');
    err.code = 'ETASK_REQUIRE_CALLABLE';
    throw err;
  }

  return spec;
};

exports.newTask = Objects.factory([EventEmitter], {

  initialize: function (spec) {
    Object.defineProperties(this, {
      id: {
        enumerable: true,
        value: spec.id
      },
      description: {
        enumerable: true,
        value: spec.description || 'No description'
      },
      dependencies: {
        value: U.isArray(spec.dependencies) ? spec.dependencies : [spec.dependencies]
      },
      init: {
        value: U.isFunction(spec.init) ? spec.init : function () {}
      },
      actions: {
        value: spec.actions
      },
      taskRunner: {
        value: spec.taskRunner
      }
    });
  },

  run: function (data) {
    var
    returns = this.returns,
    list = this.bindDependencies().concat(this.bindActions());
    return list.reduce(function (promise, fn) {
        return promise.then(fn);
      }, Promise.cast(data))
      .then(function (data) {
        if (U.isFunction(returns)) {
          return returns(data);
        }
        if (U.isString(returns) || U.isNumber(returns)) {
          return data[returns];
        }
        return data;
      });
  },

  bindDependencies: function () {
    var self = this;
    if (this.dependencies && this.dependencies.length) {
      return this.dependencies.map(function (id) {
        return self.taskRunner.getTask(id).bindActions(self.id);
      });
    }
    return [];
  },

  bindActions: function (dependentId) {
    return this.actions.map(function (action) {
      return function (args) {
        return action.call(null, args).then(U.constant(args));
      };
    });
  }
});


exports.newTask = Objects.factory([EventEmitter], {

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
  },

  bindDependencies: function () {
    var self = this;
    return this.dependencies.map(function (id) {
      return self.taskRunner.getTask(id).bindCallable(self.id);
    });
  },

  run: function (taskRunner, data) {
    var
    list = this.bindDependencies().concat(this.bindCallable());
    return list.reduce(function (promise, fn) {
      return promise.then(fn);
    }, Promise.cast(data));
  },

  bindCallable: function (dependent) {
    var
    self = this,
    fn;

    fn = function (data) {
      if (dependent) {
        self.emit('dependent', {
          dependent : dependent,
          id        : self.id
        });
      } else {
        self.emit('run', {
          id: self.id
        });
      }
      return Promise.cast(self.callable.call(self, data))
        .then(U.constant(data), self.errorHandler());
    };
    return fn;
  },

  errorHandler: function (err) {
    return Promise.reject(err);
  }
});


var
Promise = require('iou').Promise,
_       = require('lodash'),
log     = require('./log');


exports.Task = {

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
