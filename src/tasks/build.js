'use strict';

var AppTask = cb_require('tasks/app-task');

class BuildTask extends AppTask {

	run(cloudbridge, argv) {
		cloudbridge.projectDir = process.cwd();

		//var isWindows = argv._.indexOf('windows') != -1;
		var isAndroid = argv._.indexOf('android') != -1;
		var task = null;

		if (isAndroid) {
			var BuildAndroidTask = require('./build-android');
			task = new BuildAndroidTask();

			return task.run(cloudbridge, argv);
		}
		else {
			//if ((isWindows) || (!isWindows && !isAndroid)) {
			var BuildWindowsTask = require('./build-windows');
			task = new BuildWindowsTask();

			return task.run(cloudbridge, argv);
		}
	}
}

module.exports = BuildTask;
