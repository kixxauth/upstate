var
U   = require('../lib/u'),
SSH = require('../lib/ssh');


exports.initialize = function (API, args) {
  var
  log = API.log;

  API.ssh = {

    // args.host
    // args.port
    // args.username
    // args.password
    // args.privateKey
    // args.sock
    connect: function (args) {
      return connect(U.clone(args));
    },

    // args.host
    // args.port
    // args.username
    // args.password
    // args.privateKey
    // args.sock
    exec: function (command, args) {
      return connect(U.clone(args))
        .then(function (connection) {
          return connection.exec(command);
        })
        .then(function (connection) {
          connection.end();
          return connection;
        });
    }
  };


  API.sftp = {

    // args.host
    // args.port
    // args.username
    // args.password
    // args.privateKey
    // args.sock
    put: function (source, target, args) {
      return connect(U.clone(args))
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
