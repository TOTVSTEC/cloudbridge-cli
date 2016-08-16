var AppTask = cb_require('tasks/app-task'),
	android = require(__basedir + '/kits/android'),
	adb = android.adb,
	path = require('path');

var utils = cli.utils;

var RunTask = function() { };
RunTask.prototype = new AppTask();

RunTask.prototype.run = function run(cloudbridge, argv) {
	var packagePath = path.join(this.projectDir, 'build', 'android', 'build', 'outputs', 'apk', 'android-debug.apk'),
		opts = {
			replace: true
		},
		target = null;

	return adb.devices()
		.then(function(targetDevice) {
			target = targetDevice[0];

			console.log(target);

			if (targetDevice === null) {
				throw new Error("targetDevice == null");
			}

			return adb.install(target, packagePath, opts);
		})
		.then(function() {
			var activityName = 'org.helloworld.app';
			activityName += '/.';
			activityName += 'HelloWorldActivity';

			return adb.start(target, activityName);
		});
};

module.exports = RunTask;
