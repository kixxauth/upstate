var
U       = require('./u'),
Objects = require('./objects'),
Task    = require('./task');


exports.newTaskRunner = Objects.factory({

  initialize: function () {
    Object.defineProperties(this, {
      tasks: {
        value: Object.create(null)
      }
    });
  },

  task: function (spec) {
    this.tasks[spec.id] = Task.newTask({
      id           : spec.id,
      description  : spec.description,
      usage        : spec.usage,
      options      : spec.options,
      dependencies : spec.dependencies,
      init         : spec.init,
      actions      : spec.actions,
      returns      : spec.returns,
      taskRunner   : this
    });
    return this;
  },

  run: function (target, data) {
    var
    task = this.getTask(target);
    return task.run(Object.defineProperties(Object.create(null), {
      argv: task.options
    }));
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
