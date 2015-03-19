var
FilePath = require('filepath').FilePath,
Yargs    = require('yargs'),

Objects = require('./lib/objects'),
Action  = require('./lib/action').Action,
log     = require('./lib/log'),
LOADER  = require('./lib/loader');


exports.main = function () {
  newUpstate().run();
};

var newUpstate = Objects.factory([Action], {

  initialize: function () {
    this.q(this.parseArgv);
    this.q(this.checkUser);
    this.q(this.loadTasks);
    this.q(this.checkCommand);
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

  checkUser: function (args) {
    var
    argv = args.argv;

    if (argv.help) {
      printHelpAndExit();
    } else if (!argv._.length) {
      printHelpAndExit('A command is required.');
    } else if (['help', 'run', 'tasks'].indexOf(argv._[0]) === -1) {
      printHelpAndExit('"'+ argv._[0] +'" is not a valid command');
    }
    return args;
  },

  loadTasks: function (args) {
    debugger;
    return LOADER.loadTasks({
      argv: args.argv,
      task_directory: FilePath.create().append('upstate'),
    }).then(function (taskRunner) {
      args.taskRunner = taskRunner;
      return args;
    });
  },

  checkCommand: function (args) {
    var
    cmd = args.argv._[0];
    if (cmd === 'tasks') {
      printTasksAndExit(args.taskRunner.tasks);
    }
  },

  fin: function (args) {
    console.log('DONE');
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
  debugger;
  process.exit(1);
}
