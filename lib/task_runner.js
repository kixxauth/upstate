"use strict";

var
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

   newTask: function (spec) {
    this.tasks[spec.id] = Task.newTask({
      id           : spec.id,
      description  : spec.description,
      usage        : spec.usage,
      options      : spec.options,
      dependencies : spec.dependencies,
      init         : spec.init,
      actions      : spec.actions,
      returns      : spec.returns
    });
    return this;
  },

  run: function (target, API, args) {
    var
    task = this.getTask(target),
    getTask = this.getTask.bind(this);

    return task.run(API, args, getTask);
  },

  getTask: function (id, def) {
    var err,
    task = this.tasks[id];

    if (task) {
      return task;
    }

    if (arguments.length === 1) {
      err = new Error('Task "'+ id +'" does not exist.');
      err.code = 'ENOTASK';
      throw err;
    }
    return def;
  }
});
