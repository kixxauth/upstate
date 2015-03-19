var
EventEmitter = require('events'),
U            = require('./u');


exports.EventEmitter = U.extend(EventEmitter.prototype, {

  initialize: function () {
    EventEmitter.init.call(this);
  }
});
