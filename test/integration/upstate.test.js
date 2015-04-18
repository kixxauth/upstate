/*jshint expr: true*/
"use strict";

var
U    = require('../../lib/u'),
TLIB = require('../common');


describe("integration upstate", function () {

  describe('without arguments', function () {
    var
    RES   = null,
    LINES = null;

    before(function (done) {
      TLIB.exec()
        .then(function (res) {
          RES = res;
          LINES = RES.stdout.trim().split('\n');
        })
        .then(done, done);
    });

    it("notified command required", function () {
      U.last(LINES).should.match(/a command is required/i);
    });

  });

  describe('with help option', function () {
    var
    RES   = null,
    LINES = null;

    before(function (done) {
      TLIB.exec(['--help'])
        .then(function (res) {
          RES = res;
          LINES = RES.stdout.trim().split('\n');
        })
        .then(done, done);
    });

    it("has a usage line", function () {
      LINES[1].should.equal('ups <command> <task> [options]');
    });

    it("has a command line", function () {
      LINES[3].should.match(/commands/i);
    });

    it("has a options line", function () {
      LINES[8].should.match(/options/i);
    });

  });

  describe('tasks command', function () {
    var
    RES   = null,
    LINES = null;

    before(function (done) {
      TLIB.exec(['tasks'])
        .then(function (res) {
          RES = res;
          LINES = RES.stdout.trim().split('\n');
        })
        .then(done, done);
    });

    it("has a tasks line", function () {
      LINES[1].should.match(/tasks/i);
    });

  });

  describe('run command with no task', function () {
    var
    RES   = null,
    LINES = null;

    before(function (done) {
      TLIB.exec(['run'])
        .then(function (res) {
          RES = res;
          LINES = RES.stdout.trim().split('\n');
        })
        .then(done, done);
    });

    xit("has a tasks line", function () {
      LINES[1].should.match(/tasks/i);
    });

  });

});
