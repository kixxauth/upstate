"use strict";

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

  // args.host
  // args.port
  // args.username
  // args.password
  // args.privateKey
  // args.sock
  connect: function (args) {
    args = U.clone(args);
    var
    self = this,
    connection = this.connection,
    hoststring = args.username +'@'+ args.host,
    promise;

    function connect(args) {
      return new Promise(function (resolve, reject) {
        connection.on('ready', function () {
          return resolve(self);
        });
        connection.on('error', reject);
        try {
          connection.connect(args);
        } catch (err) {
          return reject(err);
        }
      });
    }

    if (args.privateKey) {
      this.log.info('ssh - connect - key: %s - %s', (args.privateKey +''), hoststring);
      this.log.stdout('ssh connect: key: %s , host: %s', (args.privateKey +''), hoststring);
      promise = FilePath.create(args.privateKey)
        .read()
        .then(function (keytext) {
          args.privateKey = keytext;
          return connect(args);
        });
    } else {
      this.log.info('ssh - connect - key: none - %s', hoststring);
      this.log.stdout('ssh connect: key: none, host: %s', hoststring);
      promise = connect(args);
    }
    return promise;
  },

  // args.host
  // args.port
  // args.username
  // args.password
  // args.privateKey
  // args.sock
  hop: function (args) {
    var
    self       = this,
    log        = this.log,
    host       = args.host,
    port       = args.port || 22,
    username   = args.username,
    password   = args.password,
    privateKey = args.privateKey,
    hoststring = username +'@'+ host;

    return new Promise(function (resolve, reject) {
      var
      cmd = 'nc '+ host +' '+ port,
      cxn2;

      log.info('ssh - hopto - key: %s - %s', (privateKey +''), hoststring);
      log.stdout('ssh hopto: key: %s , host: %s', (privateKey +''), hoststring);

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
            host       : host,
            port       : port,
            username   : username,
            password   : password,
            privateKey : privateKey
          }).then(resolve, reject);
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
      log.info('ssh exec - %s', command);
      log.stdout('ssh exec: %s', command);
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
          connection : self,
          client     : client,
          log        : self.log
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
      connection: {
        value: spec.connection
      },
      client: {
        value: spec.client
      },
      log: {
        value: spec.log
      }
    });
  },

  put: function (source, target) {
    var
    self = this,
    log = this.log,
    client = this.client,
    sourcepath = FilePath.create(source);

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
  },

  end: function () {
    this.connection.end();
  }
});