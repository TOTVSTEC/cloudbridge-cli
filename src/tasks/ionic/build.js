'use strict';

var Q = require('q'),
	AppTaskBase = require('./../app-task-base'),
	platform = cb_require('utils/platform');

class BuildTask extends AppTaskBase {

	run(cloudbridge, argv) {
		let target = this.getPlatform(argv._[1]);

		if (target === null) {
			console.error('Invalid platform: ' + argv._[1]);
			return Q();
		}

		let BuildPlatformTask = require('./build-' + target),
			task = new BuildPlatformTask(this.options);

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

module.exports = BuildTask;
