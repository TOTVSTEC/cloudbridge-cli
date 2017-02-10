'use strict';

var Task = cb_require('tasks/task'),
	utils = cli.utils;

class CheckTask extends Task {

	run(cloudbridge, argv) {
		cloudbridge.projectDir = process.cwd();

		try {
			//var isEnvironmentCmd = argv._.indexOf('environment') != -1;
			var task = null;

			//if (isEnvironmentCmd) {
			var CheckEnvironmentTask = require('./check-environment');

			task = new CheckEnvironmentTask();
			//}

			return task.run(cloudbridge, argv);
		}
		catch (ex) {
			utils.fail('An error occurred on check task:' + ex);
		}
	}

}

module.exports = CheckTask;
