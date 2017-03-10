'use strict';

let Q = require('q'),
	AppTask = cb_require('tasks/app-task'),
	platform = cb_require('utils/platform');

class RunTask extends AppTask {

	run(cloudbridge, argv) {
		let target = this.getPlatform(argv._[1]);

		if (target === null) {
			console.error('Invalid platform: ' + argv._[1]);
			return Q();
		}

		let RunPlatformTask = require('./run-' + target),
			task = new RunPlatformTask(this.options);

		return task.run(cloudbridge, argv);
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
