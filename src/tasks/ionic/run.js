'use strict';

var platform = cb_require('utils/platform'),
	AppTaskBase = require('./../app-task-base'),
	shelljs = require('shelljs');

class RunTask extends AppTaskBase {

	run(cloudbridge, argv) {
		let target = this.getPlatform(argv._[1]);

		if (target === null) {
			console.error('Invalid platform: ' + argv._[1]);
			return;
		}
		let BuildTask = require('./build'),
			task = new BuildTask(this.options);

		return task.run(cloudbridge, argv)
			.then(() => {
				if (target == "android" && !process.env._JAVA_OPTIONS) {
					process.env['_JAVA_OPTIONS'] = '-Xmx256m';
				}
				return shelljs.exec("ionic cordova run " + target);
			});
	}

	getPlatform(target) {
		if (target !== undefined) {
			return platform.valid(target);
		}
		else {
			return platform.default;
		}
	}
}

module.exports = RunTask;