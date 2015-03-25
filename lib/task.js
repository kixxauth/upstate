var
Yargs = require('yargs'),

Promise      = require('./promise'),
U            = require('./u'),
Objects      = require('./objects'),
Action       = require('./action').Action,
EventEmitter = require('./events').EventEmitter,
SubTask      = require('./subtask');


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


// spec.id
// spec.description
// spec.usage
// spec.options
// spec.dependencies
// spec.init
// spec.actions
// spec.returns
// spec.log
exports.newTask = Objects.factory([EventEmitter], {

  initialize: function (spec) {
    var
    dependencies;

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
      usage: {
        enumerable: true,
        value: spec.usage
      },
      options: {
        enumerable: true,
        value: spec.options
      },
      dependencies: {
        value: dependencies
      },
      actions: {
        value: spec.actions || []
      },
      returns: {
        enumerable: true,
        value: spec.returns
      },
      log: {
        value: spec.log
      }
    });

    if (U.isFunction(spec.init)) {
      this.actions.unshift(SubTask.newSubTask({
        id: 'init',
        callable: spec.init
      }));
    }
  },

  run: function (api, args, getTask) {
    var
    list,
    argv = this.parseArgs();
    U.extend(args, argv);
    list = bindDependencies(this.dependencies, getTask, api, args)
      .concat(bindActions(this.actions, api));
    return reduceFunctionChain(list, this.returns, args);
  },

  showHelp: function () {
    parseOptions(this.usage, this.options);
    Yargs.showHelp();
    return this;
  },

  parseArgs: function () {
    var
    argv = parseOptions(this.usage, this.options).argv;
    argv._ = argv._.slice(2);
    return argv;
  }
});


function parseOptions(usage, options) {
  var opts;

  opts = Yargs
    .reset()
    .usage('Usage: '+ (usage || ''));

  if (options && U.isObject(options)) {
    Object.keys(options).forEach(function (key) {
      var
      conf = options[key];

      if (conf.alias) {
        opts = opts.alias(key, conf.alias);
      }
      if (conf.describe) {
        opts = opts.describe(key, conf.describe);
      }
      if (conf.boolean) {
        opts = opts.boolean(key);
      }
      if (conf.required) {
        opts = opts.demand(key);
      }
    });
  }

  return opts;
}


function bindDependencies(dependencies, getTask, api, args) {
  if (!dependencies || !dependencies.length) {
    return [];
  }
  return dependencies.map(function (id) {
    var
    task = getTask(id),
    runner = U.bind(task.run, task, api, args, getTask);
    return function(args) {
      return Promise.cast(runner()).then(U.constant(args));
    };
  });
}


function bindActions(actions, api) {
  return actions.map(function (action) {
    return function (args) {
      return Promise.cast(action.run(api, args))
        .then(U.constant(args));
    };
  });
}


function reduceFunctionChain(list, returns, args) {
  return list.reduce(function (promise, fn) {
      return promise.then(fn);
    }, Promise.cast(args))
    .then(function (args) {
      if (U.isFunction(returns)) {
        return returns(args);
      }
      if (U.isString(returns) || U.isNumber(returns)) {
        return args[returns];
      }
      return args;
    });
}
