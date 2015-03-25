var
SSH = require('../lib/ssh');


exports.initialize = function (API, args) {
  var
  log = API.log;

  // args.host
  // args.port
  // args.username
  // args.password
  // args.privateKey
  // args.sock
  API.ssh = function (args) {
    return connect(args);
  };


  // args.host
  // args.port
  // args.username
  // args.password
  // args.privateKey
  // args.sock
  API.exec = function (command, args) {
    return connect(args)
      .then(function (connection) {
        return connection.exec(command);
      });
  };


  API.sftp = {
    put: function (source, target, args) {
      return connect(args)
        .then(function (connection) {
          return connection.sftp();
        })
        .then(function (sftp) {
          return sftp.put({
            source: source,
            target: target
          });
        });
    }
  };


  function connect(args) {
    return SSH.newSSH({
        log: log
      }).connect(args);
  }

  return API;
};
