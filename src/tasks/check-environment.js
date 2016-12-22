'use strict';

var CheckTask = cb_require('tasks/check'),
	android = cb_require('kits/android'),
	Info = cb_require('utils/info'),
	Q = require('q'),
	utils = cli.utils;

var CheckEnvironmentTask = function() {

};

CheckEnvironmentTask.prototype = new CheckTask();

CheckEnvironmentTask.prototype.run = function(cloudbridge, argv) {
	try {
		console.log('\n');
		cloudbridge.printCloudBridge();
		console.log('\n');

		var info = Info.gatherInfo();
		Info.getCloudBridgeCliVersion(info);

		Info.printInfo(info);

		Info.checkRuntime();

		return android.checker.check_all().then(function(requirements) {
			console.log(JSON.stringify(requirements, null, 2));
		});

		//return Q();
	}
	catch (ex) {
		utils.fail('An error occurred on check environment task:' + ex);
	}
};

module.exports = CheckEnvironmentTask;
