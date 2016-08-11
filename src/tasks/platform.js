var Task = cb_require('tasks/task').Task,
	utils = cli.utils;

var CloudBridgeTask = function() { };
CloudBridgeTask.prototype = new Task();

CloudBridgeTask.prototype.run = function(cloudbridge, argv) {
	cloudbridge.projectDir = process.cwd();

	try {
		var isAddCmd = argv._.indexOf('add') != -1;
		var isRmCmd = argv._.indexOf('rm') != -1 || argv._.indexOf('remove') != -1;
		var task = null;

		if (isAddCmd) {
			var PlatformAddTask = require('./platform-add').CloudBridgeTask,

			task = new PlatformAddTask();
		}
		else if (isRmCmd) {
			var PlatformRemoveTask = require('./platform-remove').CloudBridgeTask;

			task = new PlatformRemoveTask();
		}

		return task.run(cloudbridge, argv);
	}
	catch (ex) {
		utils.fail('An error occurred on platform task:' + ex);
	}
};

CloudBridgeTask.prototype.runCordova = function(cmdName, argv) {
	var android = require(__basedir + '/kits/android');

	android.adb.devices().then(function(data) {
		console.log(data);
	});


	/*
	return android.checker.run().then(function() {
		return android.checker.check_gradle();
	//}).then(function() {
	//	return check_reqs.check_ant();
	});
	*/
};

exports.CloudBridgeTask = CloudBridgeTask;
