var RunTask = cb_require('tasks/run'),
	android = require(__basedir + '/kits/android'),
	adb = android.adb,
	path = require('path');

var utils = cli.utils;

var RunAndroidTask = function() {

};

RunAndroidTask.prototype = new RunTask();

RunAndroidTask.prototype.run = function run(cloudbridge, argv) {
	//var packagePath = path.join(this.projectDir, 'build', 'android', 'build', 'outputs', 'apk', 'android-debug.apk'),
	var project = this.project.data(),
		packagePath = path.join(this.projectDir, 'build', project.name + '-debug.apk'),
		opts = {
			replace: true
		},
		target = null,
		activity = project.id + '/.' + project.name + 'Activity';

	return adb.devices()
		.then(function(targetDevice) {
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
};

module.exports = RunAndroidTask;
