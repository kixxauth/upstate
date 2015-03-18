var
FilePath   = require('filepath').FilePath,
Objects    = require('./objects'),
Action     = require('./action').Action,
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
  },

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
      return factory(exports);
    });
  },

  createTaskRunner: function (values) {
    values.task_runner = TaskRunner.newTaskRunner();
  },

  addTasks: function (values) {
  },

  returns: function (values) {
    return values.tasks || [];
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
  return Object.defineProperties(Object.create(null), {
    q: {
      value: function (id, fn) {
        this.subtasks.push(SubTask.newSubTask({
          id      : id,
          handler : fn
        }));
        return this;
      }
    },
    subtasks: {
      value: []
    }
  });
}
