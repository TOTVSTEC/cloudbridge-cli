#!/usr/bin/env node

'use strict';

process.title = 'cloudbridge';

global.__basedir = __dirname;
global.cb_require = function(moduleName) {
	return require(__basedir + '/src/' + moduleName);
};

global.cli = cb_require('cli');

cli.run(process.argv);
