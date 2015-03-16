var
FilePath = require('filepath').FilePath,
log      = require('./lib/log'),
LOADER   = require('./lib/loader');


exports.main = function () {
  return LOADER.loadTasks({
      task_directory: FilePath.create().append('upstate')
    })
    .then(function (task_configs) {
      console.log('OK');
      console.log(task_configs);
    })
    .catch(onerror);
};


function onerror(err) {
  var
  stack = err.stack || err.message || 'No stack trace';
  log.error('uncaught error - %s', stack);
  log.stderr('Error: uncaught error:');
  log.stderr(stack);
}

