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
          console.log('CONNECT 5')
          return resolve(self);
        });
        connection.on('error', function (err) {
          console.log('CONNECT 6')
        });
        connection.on('error', reject);
        try {
          connection.connect(opts);
        } catch (err) {
          return reject(err);
        }
          console.log('CONNECT 4')
      });
    }

    console.log('CONNECT 1')
    if (opts.privateKey) {
      promise = FilePath
        .create(opts.privateKey)
        .read()
        .then(function (keytext) {
          console.log('CONNECT 3')
          opts.privateKey = keytext;
          return connect(opts);
        });
    } else {
      promise = connect(opts);
    }
    console.log('CONNECT 2')
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
          }).then(resolve, reject);
          console.log('LIB 5')
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

  sftp: function () {
    var
    self = this;
    return new Promise(function (resolve, reject) {
      self.connection.sftp(function (err, client) {
        if (err) {
          return reject(err);
        }
        return resolve(exports.newSFTP({
          client : client,
          log    : self.log
        }));
      });
    });
  },

  end: function () {
    this.connection.end();
  }
});


// docs https://github.com/mscdex/ssh2-streams/blob/master/SFTPStream.md
exports.newSFTP = Objects.factory({
  initialize: function (spec) {
    Object.defineProperties(this, {
      client: {
        value: spec.client
      },
      log: {
        value: spec.log
      }
    });
  },

  put: function (args) {
    var
    self = this,
    log = this.log,
    client = this.client,
    sourcepath = FilePath.create(args.source),
    target = args.target;

    // options are (not currently used):
    // options.concurrency - integer - Number of concurrent reads Default: 25
    // options.chunkSize - integer - Size of each read in bytes Default: 32768
    // options.step - function(< integer >total_transferred, < integer >chunk, < integer >total)
    //     - Called every time a part of a file was transferred
    return new Promise(function (resolve, reject) {
      log.info('sftp put - %s - %s', sourcepath.toString(), target);
      log.stdout('SFTP PUT %s => %s', sourcepath.toString(), target);
      if (!sourcepath.isFile()) {
        log.error('sftp put - not a file - %s', sourcepath.toString());
        log.stderr('SFTP PUT: Not a file: %s', sourcepath.toString());
        return reject(new Error("SFTP PUT source not a file"));
      }
      client.fastPut(sourcepath.toString(), target, function (err) {
        if (err) {
          return reject(err);
        }
        return resolve(self);
      });
    });
  }
});