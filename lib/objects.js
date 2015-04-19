"use strict";

var
U = require('./u');


exports.factory = function (dependencies, extension) {
  dependencies = U.isArray(dependencies) ? dependencies : [dependencies];
  if (extension && typeof extension === 'object') {
    dependencies.push(extension);
  }
  dependencies = dependencies.map(function (dep) {
    return (dep && typeof dep === 'object') ? dep : Object.create(null);
  });
  return createFactory(createPrototype(dependencies));
};


function createPrototype(mixins) {
  var
  i, len, source, prop,
  initializers = [],
  noop = function () {},
  proto = Object.create(null);

  for (i = 0, len = mixins.length; i < len; i++) {
    source = mixins[i];
    for (prop in source) {
      if (Object.prototype.hasOwnProperty.call(source, prop)) {
        proto[prop] = source[prop];
      }
    }
    initializers[i] = source.initialize || noop;
  }

  proto.initialize = U.execute(initializers);
  return proto;
}


function createFactory(proto) {
  return function (spec) {
    var obj = Object.create(proto);
    obj.initialize(spec || Object.create(null));
    return obj;
  };
}
