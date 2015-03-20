var
FilePath   = require('filepath').FilePath,
U          = require('./u'),
Objects    = require('./objects'),
Action     = require('./action').Action,
Task       = require('./task'),
SubTask    = require('./subtask'),
TaskRunner = require('./task_runner');


var
TASK_FILE_PATTERN = /task.(js|coffee)$/;


var newLoader = Objects.factory([Action], {

  initialize: function () {
    this.q(this.checkDirectory);
    this.q(this.checkTaskFiles);
    this.q(this.registerCoffeeScript);
    this.q(this.loadTaskFiles);
    this.q(this.getTaskExports);
    this.q(this.createTaskRunner);
    this.q(this.registerTasks);
  },

  returns: 'task_runner',

  checkDirectory: function (values) {
    var
    dir = FilePath.create(values.task_directory);

    if (dir.isDirectory()) {
      values.dir = dir;
    } else {
      throw new Error('The task directory does not exist: '+ dir.toString());
    }
  },

  checkTaskFiles: function (values) {
    var
    list;
    list = values.dir.list().filter(function (file) {
      return TASK_FILE_PATTERN.test(file.toString()) && file.isFile();
    });
    if (list.length) {
      values.task_files = list;
    } else {
      throw new Error('No task files found in directory '+ values.dir.toString());
    }
  },

  registerCoffeeScript: function () {
    require('coffee-script').register();
  },

  loadTaskFiles: function (values) {
    values.task_factories = values.task_files.map(function (file) {
      var
      filestring = file.toString(),
      exp = require(filestring);
      if (U.isFunction(exp.task)) {
        return exp.task;
      } else {
        throw new Error('Task file must export a task function: '+ filestring);
      }
    });
  },

  getTaskExports: function (values) {
    values.task_exports = values.task_factories.map(function (factory) {
      var
      exports = newTaskExports();
      factory(exports);
      return Task.validateSpec(exports);
    });
  },

  createTaskRunner: function (values) {
    values.task_runner = TaskRunner.newTaskRunner();
  },

  registerTasks: function (values) {
    var
    taskRunner = values.task_runner;
    values.task_exports.forEach(taskRunner.task.bind(taskRunner));
  }

});


// Params:
// - values.task_directory
exports.loadTasks = function (values) {
  var
  loader = newLoader();
  return loader.run(values);
};


function newTaskExports() {

  function q(id, fn) {
    if (!U.isString(id)) {
      throw new Error("q() first argument must be a String id.");
    }
    if (!U.isFunction(fn)) {
      throw new Error("q() second argument must be a Function.");
    }

    this.actions.push(SubTask.newSubTask({
      id       : id,
      callable : fn
    }));

    return this;
  }

  return Object.defineProperties(Object.create(null), {
    q: {
      enumerable: true,
      value: q
    },
    actions: {
      value: []
    }
  });
}
