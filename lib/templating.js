"use strict";

var
FilePath = require('filepath').FilePath,
Promise  = require('./promise'),
U        = require('./u');


exports.renderPath = function (path, data) {
  path = FilePath.create(path);
  data = data || {};
  var err;
  return path.read().then(function (text) {
    if (!text) {
      err = new Error('Provided path does not exist or is not a file');
      err.code = 'ENOTFOUND';
      return Promise.reject(err);
    }

    return U.template(text)(data);
  });
};
