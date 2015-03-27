var
U       = require('../lib/u'),
Promise = require('../lib/promise'),
SSH     = require('../lib/ssh');


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
    args = args || {};
    var
    self = Object.create(null),
    operations = [];

    self.exec = function (command) {
      operations.push({
        method : 'exec',
        args   : arguments
      });
    };

    self.send = function () {
      return connect(U.clone(args))
        .then(execOperations);
    };

    function execOperations(connection) {
      return operations.reduce(function (promise, op) {
          return promise.then(function () {
            return connection[op.method].apply(connection, op.args);
          });
        }, Promise.resolve(connection))
        .then(function () {
          connection.end();
          return connection;
        });
    }

    return self;
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
        method : 'put',
        args   : arguments
      });
      return this;
    };

    self.hop = function (args2) {
      return newHopConnection(args, args2);
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
            return sftp[op.method].apply(sftp, op.args);
          });
        }, Promise.resolve(sftp))
        .then(function () {
          sftp.end();
          return sftp;
        });
    }

    return self;
  };


  function connect(args) {
    return SSH.newSSH({
        log: log
      }).connect(args);
  }


  function newHopConnection(args1, args2) {
    args1 = args1 || {};
    args2 = args2 || {};
    var
    self = Object.create(null),
    operations = [];

    self.exec = function (command) {
      operations.push({
        method : 'exec',
        args   : arguments
      });
    };

    self.send = function () {
      return connect(U.clone(args))
        .then(execOperations);
    };

    function execOperations(connection1) {
      return operations.reduce(function (promise, op) {
          return promise.then(function (connection2) {
            return connection2[op.method].apply(connection2, op.args);
          });
        }, connection1.hop(args2))
        .then(function () {
          connection2.end();
          connection1.end();
          return connection1;
        });
    }

    return self;
  }


  return API;
};
