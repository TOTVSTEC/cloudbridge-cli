'use strict';

var path = require('path'),
	shelljs = require('shelljs'),
	Q = require('q'),
	TaskBase = require('./../task-base'),
	CloudBridgeProject = cb_require('project/project');

class StartTask extends TaskBase {

	run(cloudbridge, argv) {
		console.log('\nThis is the cloudbridge cordova start task!\n');

		var options = cloudbridge.utils.preprocessCliOptions(argv);
		options.targetPath = path.join(this.projectDir, options.appDirectory);

		return StartTask.startApp(options)
			.then(() => {
				return StartTask.createProjectFile(options);
			});
	}


	static startApp(options) {
		if (typeof options !== 'object' || typeof options === 'undefined') {
			throw new Error('You cannot start an app without options');
		}

		if (typeof options.targetPath == 'undefined' || options.targetPath == '.') {
			throw new Error('Invalid target path, you may not specify \'.\' as an app name');
		}

		shelljs.mkdir('-p', options.targetPath);

		return Q();
	}

	static createProjectFile(options) {
		try {
			// create the cloudbridge.json file and
			// set the app name
			var project = CloudBridgeProject.create(options.targetPath, options.appName);
			project.set('name', options.appName);

			if (options.packageName) {
				project.set('id', options.packageName);
			}

			project.set('engine', 'cordova');

			project.save(options.targetPath);
		}
		catch (e) {
			console.error('Error saving project file');
		}

		return Q();
	}

}

module.exports = StartTask;
