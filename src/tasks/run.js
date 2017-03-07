'use strict';

var AppTask = cb_require('tasks/app-task');

class RunTask extends AppTask {

	run(cloudbridge, argv) {

		var run = './run-' + argv._[1];
		let task = null;
		var RunPlatform = require(run);
		task = new RunPlatform();

		return task.run(cloudbridge, argv);

	}

}

module.exports = RunTask;
