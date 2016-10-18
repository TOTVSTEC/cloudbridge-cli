var AppTask = cb_require('tasks/app-task'),
	utils = cli.utils;

var RunTask = function() { };
RunTask.prototype = new AppTask();

RunTask.prototype.run = function run(cloudbridge, argv) {
	var isWindows = argv._.indexOf('windows') != -1;
	var isAndroid = argv._.indexOf('android') != -1;

	if (isAndroid) {
		var RunAndroidTask = require('./run-android');
		let task = new RunAndroidTask();

		return task.run(cloudbridge, argv);
	}
	else {
		//if ((isWindows) || (!isWindows && !isAndroid)) {
		var RunWindowsTask = require('./run-windows');
		let task = new RunWindowsTask();

		return task.run(cloudbridge, argv);
	}
};

module.exports = RunTask;
