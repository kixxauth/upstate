var
FilePath = require('filepath').FilePath,
Objects  = require('./objects'),
Action   = require('./action').Action;


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
    values.tasks = values.task_files.map(function (file) {
      return require(file.toString());
    });
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
