'use strict';

global.__basedir = __dirname;
global.cb_require = function cb_require(moduleName) {
	return require(__basedir + '/src/' + moduleName);
};

global.cli = cb_require('cli');
