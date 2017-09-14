'use strict';

var platform = cb_require('utils/platform'),
	AppTaskBase = require('./../app-task-base'),
	child_process = require('child_process'),
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
				try {
					child_process.execSync("ionic cordova run " + target, { stdio: [0, 1, 2] })
				}
				catch (e) {
					throw e;
				}
				return 0;
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
