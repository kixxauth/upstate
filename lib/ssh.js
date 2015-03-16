var
Promise  = require('iou').Promise,
SSH      = require('ssh2'),
FilePath = require('filepath').FilePath,
log      = require('./log');


// args.host
// args.port
// args.username
// args.key
// args.command
// args.silent
exports.exec = function (args) {
  args = args || Object.create(args);
  var
  conn = new SSH.Client(),
  keyfile = FilePath.create(args.key.toString().replace(/^\~/, FilePath.home())),
  urlString = args.username +'@'+ args.host +':'+ args.port;

  log.info('ssh exec - %s - %s - %s', urlString, args.command, keyfile.toString());
  log.stdout('ssh exec %s %s %s', urlString, args.command, keyfile.toString());

  return keyfile.read().then(function (key) {

    var promise = new Promise(function (resolve, reject) {
      var res = Object.create(null);
      res.stderr = '';
      res.stdout = '';

      conn.on('ready', function () {
        conn.exec(args.command, function (err, stream) {
          if (err) {
            return reject(err);
          }
          stream.on('close', function (code, signal) {
            conn.end();
            res.code = code;
            res.signal = signal;
            if (!args.silent && res.stdout) {
              log.stdout('ssh stdout:');
              console.log(res.stdout);
            }
            if (!args.silent && res.stderr) {
              log.stderr('ssh stderr:');
              console.error(res.stderr);
            }
            return resolve(res);
          });
          stream.on('data', function (chunk) {
            res.stdout += chunk;
          });
          stream.stderr.on('data', function (chunk) {
            res.stderr += chunk;
          });
        })
      }).connect({
        host: args.host,
        port: args.port || 22,
        username: args.username,
        privateKey: key
      });
    });
    return promise;
  });
};


// args.host
// args.port
// args.username
// args.key
// args.source
// args.target
// args.silent
exports.sftpPut = function (args) {
  args = args || Object.create(args);
  var
  conn = new SSH.Client(),
  keyfile = FilePath.create(args.key.toString().replace(/^\~/, FilePath.home())),
  urlString = args.username +'@'+ args.host +':'+ args.port,
  localPath = args.source.toString(),
  remotePath = args.target.toString();

  log.info('sftp - put - %s - %s - %s - %s', urlString, localPath, remotePath, keyfile.toString());
  log.stdout('sftp PUT %s %s %s %s', urlString, localPath, remotePath, keyfile.toString());

  return keyfile.read().then(function (key) {

    var promise = new Promise(function (resolve, reject) {
      var res = Object.create(null);
      res.stderr = '';
      res.stdout = '';

      conn.on('ready', function () {
        conn.sftp(function (err, sftp) {
          if (err) {
            return reject(err);
          }
          sftp.fastPut(localPath, remotePath, function (err, a) {
            conn.end();
            if (err) {
              return reject(err);
            }
            console.log('INTERESTING', a);
            return null;
          });
        });
      }).connect({
        host: args.host,
        port: args.port || 22,
        username: args.username,
        privateKey: key
      });
    });
    return promise;
  });
};
