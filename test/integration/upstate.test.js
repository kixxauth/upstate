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

});
