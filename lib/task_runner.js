var
U       = require('./u'),
Objects = require('./objects'),
Task    = require('./task'),
Plugins = require('./plugins');


exports.newTaskRunner = Objects.factory({

  initialize: function (spec) {
    Object.defineProperties(this, {
      tasks: {
        value: Object.create(null)
      },
      log: {
        value: spec.log
      }
    });
  },

   newTask: function (spec) {
    this.tasks[spec.id] = Task.newTask({
      id           : spec.id,
      description  : spec.description,
      usage        : spec.usage,
      options      : spec.options,
      dependencies : spec.dependencies,
      init         : spec.init,
      actions      : spec.actions,
      returns      : spec.returns,
      log          : this.log,
    });
    return this;
  },

  run: function (target, data) {
    var
    task = this.getTask(target),
    getTask = this.getTask.bind(this);

    return task.run(api, args, getTask);
  },

  getTask: function (id, def) {
    var err,
    task = this.tasks[id];

    if (task) return task;

    if (arguments.length === 1) {
      err = new Error('Task "'+ id +'" does not exist.');
      err.code = 'ENOTASK';
      throw err;
    }
    return def;
  }
});


function setTaskArguments(task, data) {
  return Plugins.initializers({
      argv: task.options
    })
    .then(function (_args) {
      var
      args             = U.safeCopy(_args);
      args.config      = U.safeCopy(data.config);
      args.user_data   = U.safeCopy(data.user_data || {});
      args.environment = data.environment;
      args.directory   = data.directory;
      delete args.argv;
      return args;
    });
}
