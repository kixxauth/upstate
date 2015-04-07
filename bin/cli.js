#!/usr/bin/env node
"use strict";

process.title = 'upstate';

var
PATH = require('path'),
FS   = require('fs'),
cwd  = PATH.join(process.cwd(), 'node_modules', 'upstate'),
dir  = FS.existsSync(cwd) ? cwd :
       PATH.dirname(PATH.dirname(FS.realpathSync(__filename)));

console.log('Running upstate from %s', dir);
require(dir).main();
