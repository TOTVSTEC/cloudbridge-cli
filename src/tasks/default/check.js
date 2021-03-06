'use strict';

var TaskBase = require('./../task-base'),
	utils = cli.utils;

class CheckTask extends TaskBase {

	run(cloudbridge, argv) {
		try {
			//var isEnvironmentCmd = argv._.indexOf('environment') !== -1;
			var task = null;

			//if (isEnvironmentCmd) {
			var CheckEnvironmentTask = require('./check-environment');

			task = new CheckEnvironmentTask(this.options);
			//}

			return task.run(cloudbridge, argv);
		}
		catch (ex) {
			utils.fail('An error occurred on check task:' + ex);
		}
	}

}

module.exports = CheckTask;
