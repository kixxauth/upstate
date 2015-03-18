var
Objects  = require('./objects'),
Task = require('./task');


exports.newTaskRunner = Objects.factory({

  initialize: function () {
    Object.defineProperties(this, {
      tasks: {
        value: []
      }
    });
  },

  task: function (id, dependencies, fn) {
    this.tasks[id] = Task.create({
      id           : id,
      dependencies : dependencies,
      callable     : fn,
      taskRunner   : this
    });
    return this;
  },

  run: function (target, data) {
    data = data || Object.create(null);
    return this.getTask(target).run(this, data);
  },

  getTask: function (name, def) {
    var err,
    task = this.tasks[name];

    if (task) return task;

    if (arguments.length === 1) {
      err = new Error('Task "'+ name +'" does not exist.');
      err.code = 'ENOTASK';
      throw err;
    }
    return def;
  }
});
