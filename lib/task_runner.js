var Task = require('./task').Task;


// TaskRunner prototype:
exports.TaskRunner = {

  task: function (id, dependencies, fn) {
    this.tasks[id] = Task.create({
      id           : id,
      dependencies : dependencies,
      callable     : fn,
      taskRunner   : this
    });
    return this;
  },

  before: function (target, name, fn) {
    this.getTask(target).before(name, fn);
    return this;
  },

  after: function (target, name, fn) {
    this.getTask(target).after(name, fn);
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
  },

  create: function () {
    var
    self = Object.create(exports.TaskRunner);
    Object.defineProperties(self, {
      tasks: {
        value: []
      }
    });
    return self;
  }
};
