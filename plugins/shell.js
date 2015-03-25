var
CMDS = require('command_runner');


exports.initialize = function (API, args) {
  var
  log = API.log;

  API.shell = function (cmd, opts) {
    opts = opts || {};

    log.info('shell command - %s', cmd);
    log.stdout('shell command: %s', cmd);

    return CMDS.exec(cmd).then(function (res) {
      var err;
      if (res.exitCode) {
        log.error('error - shell command - %s - %s', cmd, res.stderr);
        err = new Error('Shell command exec error');
        err.code = 'ESHELL_COMMAND';
        err.exitCode = res.exitCode;
      }
      if (!opts.silent && res.stdout) {
        log.stdout('stdout:');
        console.log(res.stdout);
      }
      if (!opts.silent && res.stderr) {
        log.stderr('stderr:');
        console.error(res.stderr);
      }
      if (err) {
        return Promise.reject(err);
      }
      return res;
    });
  };

  return API;
};
