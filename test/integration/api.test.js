/*jshint expr: true*/
"use strict";


var
TLIB = require('../common');


describe("integration api", function () {

  describe('run command with fixture task', function () {
    var
    INIT_CALLED = false,
    API         = null,
    ARGS        = null;

    before(function (done) {
      TLIB.exec(['run','test_fixture', '-e', 'test', '-r', 'foo', '-b'])
        .then(function (res) {
          INIT_CALLED = res.json.init_called;
          ARGS        = res.json.args;
          API         = res.json.API;
        })
        .then(done, done);
    });

    it("called init", function () {
      INIT_CALLED.should.be.true;
    });

    describe('API', function () {

      it('has a path api', function () {
        var
        path     = API.path,
        root     = path.attributes.root,
        datename = path.attributes.datename,
        expand   = path.attributes.expand;

        path.type.should.equal('function');
        root.type.should.equal('function');
        root.val.path.should.equal('/');
        datename.type.should.equal('function');
        datename.val.should.match(/^20[\d]{2}_[\d]{2}_/);
        expand.type.should.equal('function');
        expand.val.path.should.be.a.String;
      });

      it('has a template_path api', function () {
        API.template_path.type.should.equal('function');
      });

      it('has a shell api', function () {
        API.shell.type.should.equal('function');
      });

      it('has an ssh api', function () {
        API.ssh.type.should.equal('function');
      });

      it('has an sftp api', function () {
        API.sftp.type.should.equal('function');
      });

      it('has a log api', function () {
        var
        log = API.log,
        stdout = log.attributes.stdout,
        stderr = log.attributes.stderr;
        log.type.should.equal('object');
        stdout.type.should.equal('function');
        stderr.type.should.equal('function');
      });

    });

    describe('args', function () {

      it('has .environment', function () {
        ARGS.environment.val.should.equal('test');
      });

      it('has .config', function () {
        ARGS.config.type.should.equal('object');
        ARGS.config.val.should.be.ok;
      });

      it('has parsed commandline options', function () {
        var
        opts = ARGS.options;
        opts.req.type.should.equal('string');
        opts.req.val.should.equal('foo');
        opts.bool.type.should.equal('boolean');
        opts.bool.val.should.equal(true);
      });

      it('has .user_data', function () {
        ARGS.user_data.type.should.equal('object');
      });

      it('has .directory', function () {
        ARGS.directory.type.should.equal('object');
        ARGS.directory.val.path.should.be.a.String;
      });

      it('has .git_config', function () {
        var
        config = ARGS.git_config;
        config.core.bare.should.equal(false);
        config['remote "origin"'].url.should.equal('git@github.com:kixxauth/upstate.git');
      });

    });

  });
});
