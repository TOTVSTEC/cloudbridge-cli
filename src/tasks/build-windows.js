'use strict';

let AppTask = cb_require('tasks/app-task'),
	path = require('path'),
	utils = cb_require('utils/utils');

const AppServer = require('totvs-platform-helper/appserver');
const DevStudio = require('totvs-platform-helper/tds');

const APPSERVER_DIR = path.join('build', 'windows', 'bin', 'appserver');

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

	var appserver = new AppServer(path.join(projectDir, APPSERVER_DIR)),
		tds = new DevStudio();

	return appserver.start()
		.then(function() {
			tdsOptions.port = appserver.tcpPort;

			return tds.compile(tdsOptions);
		})
		.then(function() {
			return appserver.stop();
		});
};

module.exports = BuildWindowsTask;
