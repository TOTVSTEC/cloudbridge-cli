'use strict';

global.__basedir = __dirname;
global.cb_require = function cb_require(moduleName, engine) {
	engine = engine || 'default';

	if (moduleName.startsWith('tasks/')) {
		moduleName = moduleName.replace('tasks/', 'tasks/' + engine + '/');
	}

	return require(__basedir + '/src/' + moduleName);
};

global.cli = cb_require('cli');
