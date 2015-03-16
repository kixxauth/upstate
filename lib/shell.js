var
Promise  = require('iou').Promise,
log      = require('./log'),
COMMANDS = require('command_runner');

exports.shell = function (cmd, opts) {
  opts = opts || Object.create(null);

  log.info('shell command - %s', cmd);
  log.stdout('shell command: %s', cmd);

  return COMMANDS.exec(cmd).then(function (res) {
    var err;
    if (res.exitCode) {
      log.error('error - shell command - %s - %s', cmd, res.stderr);
      log.stderr('Shell command error: exit code %d', res.exitCode);
      err = new Error('Shell command exec error');
      err.code = 'ESHELL_COMMAND';
      err.exitCode = res.exitCode;
      return Promise.reject(err);
    }
    if (!opts.silent && res.stdout) {
      log.stdout('stdout:');
      console.log(res.stdout);
    }
    if (!opts.silent && res.stderr) {
      log.stderr('stderr:');
      console.error(res.stderr);
    }
    return res;
  });
};
