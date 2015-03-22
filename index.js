var
FilePath = require('filepath').FilePath,
Yargs    = require('yargs'),

Promise = require('./lib/promise'),
Objects = require('./lib/objects'),
Action  = require('./lib/action').Action,
log     = require('./lib/log'),
Plugins = require('./lib/Plugins'),
LOADER  = require('./lib/loader');


exports.main = function () {
  newUpstate().run();
};

var newUpstate = Objects.factory([Action], {

  initialize: function (args) {
    this.q(this.parseArgv);
    this.q(this.setDirectory);
    this.q(this.loadConfigs);
    this.q(this.checkUser);
    this.q(this.loadTasks);
    this.q(this.checkCommand);
    this.q(this.runTask);
    this.q(this.fin);
  },

  parseArgv: function (args) {
    args.argv = Yargs
      .usage('ups <command> <task> [options]')
      .command('help', 'Print out the help text for a particular task')
      .command('run', 'Run a task')
      .command('tasks', 'Print out a list of available tasks')
      .option('h', {
        alias    : 'help',
        describe : 'Print out this help text and exit.'
      })
      .argv;
    return args;
  },

  setDirectory: function (args) {
    args.directory = FilePath.create().append('upstate');
    return args;
  },

  loadConfigs: function (args) {
    var
    confPath = args.directory.append('config.ini');

    return Plugins.PLUGINS.read_ini.api(confPath)
      .then(function (config) {
        config = config || {};
        var
        userDataPath = (config.paths || {}).user_data;
        args.config = config;

        if (userDataPath) {
          userDataPath = userDataPath.replace(/^\~/, FilePath.home().toString());
          return Plugins.PLUGINS.read_ini.api(userDataPath)
            .then(function (userData) {
              var msg;
              if (!userData) {
                msg = 'User data file not found at '+ userDataPath;
                return Promise.reject(new Error(msg));
              }
              args.user_data = userData;
              return args;
            });
        }
        return args;
      });
  },

  checkUser: function (args) {
    var
    argv = args.argv;

    if (!argv._.length && argv.help) {
      printHelpAndExit();
    } else if (!argv._.length) {
      printHelpAndExit('A command is required.');
    } else if (['help', 'run', 'tasks'].indexOf(argv._[0]) === -1) {
      printHelpAndExit('"'+ argv._[0] +'" is not a valid command');
    }
    Yargs.reset();
    return args;
  },

  loadTasks: function (args) {
    return LOADER.loadTasks({
      task_directory: args.directory
    }).then(function (taskRunner) {
      args.taskRunner = taskRunner;
      return args;
    });
  },

  checkCommand: function (args) {
    var
    cmd = args.argv._[0],
    taskId = args.argv._[1];

    if (cmd === 'tasks') {
      printTasksAndExit(args.taskRunner.tasks);
    } else if (cmd === 'help') {
      printTaskHelpAndExit(args.taskRunner.tasks[taskId]);
    }
    args.taskId = taskId;
    return args;
  },

  runTask: function (args) {
    var
    promise;
    try {
      promise = args.taskRunner.run(args.taskId, args)
        .then(function (result) {
          args.result = result;
          return args;
        });
    } catch (err) {
      if (err.code === 'ENOTASK') {
        promise = Promise.reject({
          message: 'The task '+ args.taskId +' does not exist.'
        });
      } else {
        promise = Promise.reject(err);
      }
    }
    return promise;
  },

  fin: function (args) {
    log.stdout(' *** upstate run complete ***');
  },

  onerror: function (err) {
    var
    stack = err.stack || err.message || 'No stack trace';
    log.error('uncaught error - %s', stack);
    log.stderr('Error: uncaught error:');
    log.stderr(stack);
    return null;
  }
});


function printHelpAndExit(msg) {
  if (msg) {
    console.log(Yargs.help() +'\n\n'+ msg);
  } else {
    console.log(Yargs.help());
  }
  process.exit(1);
}


function printTasksAndExit(tasks) {
  var keys = Object.keys(tasks);
  if (keys.length) {
    console.log('Registered tasks:');
    keys.forEach(function (key) {
      var task = tasks[key];
      console.log(' - %s : %s', task.id, task.description);
    });
  } else {
    console.log('No tasks have been registered.');
  }
  process.exit(1);
}


function printTaskHelpAndExit(task) {
  console.log('\n'+ task.id);
  console.log('\n'+ task.description);
  console.log(task.help);
  process.exit(1);
}
