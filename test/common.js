"use strict";

require('should');

var
U        = require('../lib/u'),
CR       = require('command_runner'),
FilePath = require('filepath').FilePath,

EXEC = FilePath.create().append('bin', 'cli.js');


exports.exec = function (argv, options) {
  options = options || Object.create(null);

  if (argv) {
    argv = argv.slice();
  } else {
    argv = [];
  }
  argv.unshift(EXEC);

  if (options.chdir) {
    process.chdir(options.chdir.toString());
  }

  return CR.spawn('node', argv, options).then(function (res) {
    var
    stdout;
    if (res.stdout) {
      stdout = res.stdout.trim().split('\n');
      try {
        res.json = JSON.parse(stdout.slice(2, -1).join('\n'));
      } catch (e) {
        res.json = null;
      }
    }
    if (res.stderr) {
      res.lines = res.stderr.split('\n');
    } else {
      res.lines = [];
    }
    if (res.lines.length && /Unhandled rejection/.test(res.lines[0])) {
      console.error('\n *** Program exec crash:');
      console.error(res.stderr);
    }
    return U.safeCopy(res);
  });
};
