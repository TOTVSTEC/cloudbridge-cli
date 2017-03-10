'use strict';

var RunTask = cb_require('tasks/run'),
	android = cb_require('kits/android'),
	adb = android.adb,
	checker = android.checker,
	path = require('path');

class RunAndroidTask extends RunTask {

	run(cloudbridge, argv) {
		var project = this.project.data(),
			packagePath = path.join(this.projectDir, 'build', project.name + '-debug.apk'),
			opts = {
				replace: true
			},
			target = null,
			activity = project.id + '/.' + project.name + 'Activity';

		return checker.check_android()
			.then(() => {
				return this.build(argv);
			})
			.then(() => {
				return adb.devices();
			})
			.then((targetDevice) => {
				console.log('\n');
				console.log('targetDevice', targetDevice);
				console.log('\n');

				if (targetDevice.length === 0) {
					throw new Error("No devices found.");
				}

				target = targetDevice[0];

				return adb.install(target, packagePath, opts);
			})
			.then(function() {
				//var activityName = 'org.helloworld.app';
				//activityName += '/.';
				//activityName += 'HelloWorldActivity';

				return adb.start(target, activity);
			});
	}

	build(argv) {
		let BuildAndroidTask = require('./build-android'),
			task = new BuildAndroidTask(this.options);

		return task.run(cli, argv);
	}

}

module.exports = RunAndroidTask;
