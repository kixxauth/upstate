var
FilePath = require('filepath').FilePath,
Yargs    = require('yargs'),

Promise = require('./lib/promise'),
Objects = require('./lib/objects'),
U       = require('./lib/u'),
Action  = require('./lib/action').Action,
LOADER  = require('./lib/loader'),
Configs = require('./lib/config_loader');


exports.main = function () {
  newUpstate().run();
};

var newUpstate = Objects.factory([Action], {

  initialize: function (args) {
    this.q(this.parseArgv);
    this.q(this.checkArgv);
    this.q(this.setValues);
    this.q(this.loadConfigs);
    this.q(this.runInitializers);
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
      .option('e', {
        alias    : 'env',
        describe : 'The environment to use.',
      })
      .argv;
    return args;
  },

  checkArgv: function (args) {
    var
    argv    = args.argv,
    command = argv._[0];

    if (!command && argv.help) {
      printHelpAndExit();
    } else if (!command) {
      printHelpAndExit('A command is required.');
    } else if (['help', 'run', 'tasks'].indexOf(argv._[0]) === -1) {
      printHelpAndExit('"'+ argv._[0] +'" is not a valid command');
    } else if (command === 'run' && !argv.env) {
      printHelpAndExit('The -e --env argument must be passed.');
    }
    return args;
  },

  setValues: function (args) {
    args.environment  = args.argv.env;
    args.directory    = FilePath.create().append('upstate');
    return args;
  },

  loadConfigs: function (args) {
    return Configs.newConfigLoader().run({
      configPath  : args.directory.append('config.ini'),
      environment : args.environment
    }).then(function (configs) {
      args.config = configs.config;
      args.user_data = configs.user_data;
      args.logDirectory = FilePath.create().append('log', 'upstate');
      args.logFilename  = args.config.project_name;
      return args;
    });
  },

  runInitializers: function (args) {
    var
    API = Object.create(null);

    return Promise.cast(args)
      .then(function () {
        return require('./initializers/log').initialize(API, args);
      })
      .then(function () {
        return require('./initializers/plugins').initialize(API, args);
      })
      .then(function () {
        args.log = API.log;
        args.API = U.safeCopy(API);
        return args;
      })
      .then(function (args) {
        return args.API.git_config().then(function (git_config) {
          args.git_config = git_config;
          return args;
        });
      })
      .then(U.constant(args));
  },

  loadTasks: function (args) {
    return LOADER.loadTasks({
      task_directory : args.directory
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
    promise,
    ARGS = U.safeCopy({
      git_config: args.git_config
    });

    args.log.info('start upstate run');
    args.log.stdout('Starting an upstate run');
    try {
      promise = args.taskRunner.run(args.taskId, args.API, ARGS)
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
    args.log.info('upstate run complete');
    args.log.stdout('This upstate run is complete');
  },

  onerror: function (err) {
    var
    stack = err.stack || err.message || 'No stack trace';
    console.error('Error: uncaught error:');
    console.error(stack);
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
      console.log('- %s:\n%s', task.id, task.description);
    });
  } else {
    console.log('No tasks have been registered.');
  }
  process.exit(1);
}


function printTaskHelpAndExit(task) {
  console.log('\n'+ task.id);
  console.log('\n'+ task.description);
  task.showHelp();
  process.exit(1);
}
