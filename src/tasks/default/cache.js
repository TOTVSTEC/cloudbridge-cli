'use strict';

var path = require('path'),
	shelljs = require('shelljs'),
	Q = require('q'),
	TaskBase = require('./../task-base');

class CacheTask extends TaskBase {

	run(cloudbridge, argv) {
		var isList = ((argv._.indexOf('list') !== -1) || (argv._.indexOf('ls') !== -1));
		var isClean = ((argv._.indexOf('clean') !== -1) || (argv._.indexOf('rm') !== -1));

		if (isList) {
			this.list();
		}
		else if (isClean) {
			this.clean();
		}
		else {
			console.log("Invalid command!");
		}

		return Q();
	}

	list() {
		let homeDir = process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH,
			packageDir = path.join(homeDir, '.cloudbridge', 'packages'),
			groups = [];

		console.log('\nCloudBridge packages cache located at: ' + packageDir + '\n');

		if (shelljs.test('-e', packageDir)) {
			groups = shelljs.ls(packageDir);
		}

		if (groups.length === 0) {
			console.log('Nothing in cache.');
		}

		for (var i = 0; i < groups.length; i++) {
			var group = groups[i],
				packs = shelljs.ls(path.join(packageDir, group));

			for (var j = 0; j < packs.length; j++) {
				var pack = packs[j],
					versions = shelljs.ls(path.join(packageDir, group, pack));

				for (var k = 0; k < versions.length; k++) {
					var version = versions[k];

					console.log(' - ' + path.join(group, pack, version));
				}
			}
		}
	}

	clean() {
		var homeDir = (process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH),
			packageDir = path.join(homeDir, '.cloudbridge', 'packages');

		shelljs.rm('-rf', packageDir);
		shelljs.mkdir('-p', packageDir);
	}

}

module.exports = CacheTask;
