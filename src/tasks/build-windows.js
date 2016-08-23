'use strict';

var AppTask = cb_require('tasks/app-task'),
	path = require('path'),
	Q = require('q'),
	utils = cb_require('utils/utils'),
	tds = cb_require('utils/tds');

var BuildWindowsTask = function() { };
BuildWindowsTask.prototype = new AppTask();

BuildWindowsTask.prototype.run = function run(cloudbridge, argv) {
	path.join(this.projectDir, 'build', 'bin', 'appserver');


	var options = {
		serverType: "Logix",
		server: "127.0.0.1",
		build: "7.00.150715P",
		port: 5056,
		//user: "admin",
		//psw: "",
		recompile: true,
		environment: "ENVIRONMENT",
		program: [
			path.join(this.projectDir, 'src', 'advpl')
		],
		includes: [
			"C:/dev/src/framework/Lib110/include",
			"C:/dev/src/framework/Lib110/include-lib"
		]
	};

	return tds.compile(options);
};

module.exports = BuildWindowsTask;
