'use strict';

var AppTask = cb_require('tasks/app-task');

class RunTask extends AppTask {

	run(cloudbridge, argv) {

		var run = './run-' + argv._[1];
		let task = null;
		var RunAndroidTask = require(run);

		switch(argv._[1]){
			case "android":
				task = new RunAndroidTask();
				break;
			case "windows":
				task = new RunWindowsTask();
				break;
		}


		return task.run(cloudbridge, argv);

	}

}

module.exports = RunTask;
