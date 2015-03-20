var
Yargs = require('yargs'),

Promise      = require('./promise'),
U            = require('./u'),
Objects      = require('./objects'),
Action       = require('./action').Action,
EventEmitter = require('./events').EventEmitter;


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
    var
    dependencies,
    argv = parseOptions(spec.id, spec.usage, spec.options);

    if (spec.dependencies) {
      dependencies = U.isArray(spec.dependencies) ? spec.dependencies : [spec.dependencies];
    } else {
      dependencies = [];
    }

    Object.defineProperties(this, {
      id: {
        enumerable: true,
        value: spec.id
      },
      description: {
        enumerable: true,
        value: spec.description || 'No description'
      },
      options: {
        enumerable: true,
        value: argv.argv
      },
      help: {
        enumerable: true,
        value: argv.help()
      },
      dependencies: {
        value: dependencies
      },
      init: {
        value: U.isFunction(spec.init) ? spec.init : function () {}
      },
      actions: {
        value: spec.actions
      },
      returns: {
        enumerable: true,
        value: spec.returns
      },
      taskRunner: {
        value: spec.taskRunner
      }
    });
  },

  run: function (args) {
    var
    data,
    options = this.options,
    returns = this.returns,
    list = this.bindDependencies()
      .concat(this.bindInit())
      .concat(this.bindActions());

    delete this.options._;
    delete this.options['$0'];

    data = Object.keys(options).reduce(function (data, key) {
      Object.defineProperty(data, key, {
        enumerable: true,
        value: options[key]
      });
      return data;
    }, Object.create(null));

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

  bindInit: function () {
    var
    init = this.init;
    return function(args) {
      return Promise.cast(init.call(null, args)).then(U.constant(args));
    };
  },

  bindActions: function (dependentId) {
    return this.actions.map(function (action) {
      return function (args) {
        return Promise.cast(action.run(args)).then(U.constant(args));
      };
    });
  }
});


function parseOptions(id, usage, options) {
  var
  argv = Yargs.usage(usage || 'No usage message for '+ id +' task');

  argv = argv.options('h', {alias: 'help'}).boolean('h');

  Object.keys(options).forEach(function (key) {
    var
    conf = options[key];

    if (conf.alias) {
      argv = argv.alias(key, conf.alias);
    }
    if (conf.describe) {
      argv = argv.describe(key, conf.describe);
    }
    if (conf.boolean) {
      argv = argv.boolean(key);
    }
    if (conf.required) {
      argv = argv.demand(key);
    }
  });

  return argv;
}