var
FilePath = require('filepath').FilePath,
SSH      = require('ssh2'),
Promise  = require('./promise'),
U        = require('./u'),
Objects  = require('./objects');


exports.newSSH = Objects.factory({

  initialize: function (spec) {
    Object.defineProperties(this, {
      log: {
        value: spec.log
      },
      connection: {
        value: new SSH.Client()
      }
    });
  },

  // opts.host
  // opts.port
  // opts.username
  // opts.password
  // opts.privateKey
  // opts.sock
  connect: function (opts) {
    opts = U.clone(opts || Object.create(null));

    var
    self = this,
    connection = this.connection,
    promise;

    function connect(opts) {
      return new Promise(function (resolve, reject) {
        connection.on('ready', function () {
          return resolve(self);
        });
        connection.on('error', reject);
        try {
          connection.connect(opts);
        } catch (err) {
          return reject(err);
        }
      });
    }

    if (opts.privateKey) {
      promise = FilePath
        .create(opts.privateKey)
        .read()
        .then(function (keytext) {
          opts.privateKey = keytext;
          return connect(opts);
        });
    } else {
      promise = connect(opts);
    }
    return promise;
  },

  // opts.host
  // opts.port
  // opts.username
  // opts.password
  // opts.privateKey
  hop: function (args) {
    var
    self       = this,
    log        = this.log,
    host       = args.host,
    port       = args.port || 22,
    username   = args.username,
    password   = args.password,
    privateKey = args.privateKey;

    return new Promise(function (resolve, reject) {
      var
      cmd = 'nc '+ host +' '+ port,
      cxn2;
      self.connection.exec(cmd, function (err, stream) {
        if (err) {
          self.connection.end();
          return reject(err);
        }
        cxn2 = exports.newSSH({
          log: log
        });
        cxn2.connection.on('ready', function () {
          return resolve(cxn2);
        });
        cxn2.connection.on('error', reject);
        try {
          cxn2.connect({
            sock       : stream,
            username   : username,
            password   : password,
            privateKey : privateKey
          });
        } catch (err) {
          return reject(err);
        }
      });
    });
  },

  exec: function (command) {
    var
    self = this,
    log = this.log;
    return new Promise(function (resolve, reject) {
      self.connection.exec(command, function (err, stream) {
        if (err) {
          self.connection.end()
          return reject(err);
        }
        stream.setEncoding('utf8');
        stream.on('close', function (code, signal) {
          log.info('ssh exec - close - code=%s - signal=%s - %s', code, signal, command);
          log.stdout('ssh exec - close - code = %s - signal = %s', code, signal);
          return resolve(self);
        });
        stream.on('data', function (data) {
          log.info('ssh exec - stdout - %s', data);
          log.stdout('ssh> '+ data);
        });
        stream.stderr.on('data', function (data) {
          log.error('ssh exec - stdout - %s', data);
          log.stderr('ssh> '+ data);
        });
      });
    });
  },

  end: function () {
    this.connection.end();
  }
});
