'use strict';

var path = require('path'),
	appserver,
	smartclient;

if (process.platform == 'win32') {
	appserver = path.join('build', 'windows', 'bin', 'appserver', 'appserver.exe');
	smartclient = path.join('build', 'windows', 'bin', 'smartclient', 'smartclient.exe');
}
else if (process.platform == 'linux') {
	appserver = path.join('build', 'linux', 'bin', 'appserver', 'appserver');
	smartclient = path.join('build', 'linux', 'bin', 'smartclient', 'smartclient');
}
else if (process.platform == 'darwin') {
	appserver = path.join('build', 'osx', 'bin', 'appserver', 'appserver');
	smartclient = path.join('build', 'osx', 'bin', 'smartclient', 'smartclient');
}



module.exports = {
	appserver: appserver,
	smartclient: smartclient,
	join: path.join,
	get: function get(id, basedir) {
		basedir = basedir || '';

		switch (id.toUpperCase()) {
			case 'APPSERVER':
				return path.join(basedir, appserver);
			case 'SMARTCLIENT':
				return path.join(basedir, smartclient);
			case 'ADVPL_SRC':
				return path.join(basedir, 'src', 'advpl');
			case 'ADVPL_INCLUDES':
				return path.join(basedir, 'build', 'advpl', 'includes');
			case 'ANDROID_SRC':
				return path.join(basedir, 'src', 'android');
			default:
				break;
		}

	}
};



