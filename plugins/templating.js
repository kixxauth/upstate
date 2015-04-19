"use strict";

var
Promise = require('../lib/promise'),
TPL     = require('../lib/templating');


exports.initialize = function (API) {
  var
  log = API.log;

  API.template_path = function (path, data) {
    return TPL.renderPath(path, data).catch(function (err) {
      if (err.code === 'ENOTFOUND') {
        log.error('template_path - enotfound - %s', path +'');
        log.stderr('template_path: Path is not a file: %s', path +'');
      }
      return Promise.reject(err);
    });
  };

  return API;
};
