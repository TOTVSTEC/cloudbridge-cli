'use strict';

var AppTask = cb_require('tasks/app-task'),
	path = require('path'),
	Q = require('q'),
	utils = cb_require('utils/utils'),
	tds = cb_require('utils/tds'),
	appserver = cb_require('utils/appserver');

var BuildWindowsTask = function() { };
BuildWindowsTask.prototype = new AppTask();

BuildWindowsTask.prototype.run = function run(cloudbridge, argv) {
	var projectDir = this.projectDir,
		tdsOptions = {
			serverType: "Logix",
			server: "127.0.0.1",
			build: "7.00.150715P",
			port: 5056,
			//user: "admin",
			//psw: "",
			recompile: true,
			environment: "ENVIRONMENT",
			program: [
				path.join(projectDir, 'src', 'advpl')
			],
			includes: [
				path.join(projectDir, 'src', 'advpl'),
				path.join(projectDir, 'build', 'advpl', 'includes')
			]
		};

	return appserver.start(projectDir)
		.then(function() {
			tdsOptions.port = appserver.tcpPort;

			return tds.compile(tdsOptions);
		})
		.then(function() {
			return appserver.stop();
		});


/*
	return appserver.getStatus(projectDir)
		.then(function(status) {
			if (!status.installed) {
				return appserver.install(projectDir, true)
					.then(function() {
						appserver.start(projectDir);
					});
			}

			if (!status.running) {
				return appserver.start(projectDir);
			}
		})
		.then(function() {
			return tds.compile(tdsOptions);
		})
		.then(function() {
			return appserver.stop();
		});
		*/
};

module.exports = BuildWindowsTask;
