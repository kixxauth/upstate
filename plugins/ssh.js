var
U       = require('../lib/u'),
Promise = require('../lib/promise'),
SSH     = require('../lib/ssh');


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


  // args.host
  // args.port
  // args.username
  // args.password
  // args.privateKey
  // args.sock
  API.sftp = function (args) {
    args = args || {};
    var
    self = Object.create(null),
    operations = [];

    self.put = function (source, target) {
      operations.push({
        source : source,
        target : target
      });
      return this;
    };

    self.send = function () {
      return connect(U.clone(args))
        .then(function (connection) {
          return connection.sftp()
            .then(execOperations);
        });
    };

    function execOperations(sftp) {
      return operations.reduce(function (promise, op) {
          return promise.then(function () {
            return sftp.put(op.source, op.target);
          });
        }, Promise.resolve(sftp))
        .then(U.constant(sftp));
    }

    return self;
  };


  function connect(args) {
    return SSH.newSSH({
        log: log
      }).connect(args);
  }

  return API;
};
