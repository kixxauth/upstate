"use strict";

var
FilePath = require('filepath').FilePath;


exports.initialize = function (API) {

  API.git_config = function () {
    return FilePath.create().append('.git', 'config').readIni();
  };

  return API;
};