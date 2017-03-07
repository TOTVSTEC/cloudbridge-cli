'use strict';

var AppTask = cb_require('tasks/app-task');

class BuildTask extends AppTask {

	run(cloudbridge, argv) {
		cloudbridge.projectDir = process.cwd();

		var task = null;
		var run = './build-' + argv._[1];
		var BuildPlatform = require(run);
		task = new BuildPlatform();

		return task.run(cloudbridge, argv);
	}
}

module.exports = BuildTask;
