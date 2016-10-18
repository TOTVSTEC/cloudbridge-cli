'use strict';

var AppTask = cb_require('tasks/run'),
	path = require('path'),
	utils = cb_require('utils/utils');

const SmartClient = require('totvs-platform-helper/smartclient');
const AppServer = require('totvs-platform-helper/appserver');

const APPSERVER_DIR = path.join('build', 'windows', 'bin', 'appserver');
const SMARTCLIENT_DIR = path.join('build', 'windows', 'bin', 'smartclient');

var RunWindowsTask = function() {

};

RunWindowsTask.prototype = new AppTask();

RunWindowsTask.prototype.run = function run(cloudbridge, argv) {
	var appserver = new AppServer(path.join(this.projectDir, APPSERVER_DIR)),
		smartclient = new SmartClient(path.join(this.projectDir, SMARTCLIENT_DIR)),
		program = this.project.get('name') +  '.Cloud';

	return appserver.start()
		.then(function() {
			return smartclient.run({
				program: program,
				communication: {
					address: "localhost",
					port: appserver.tcpPort
				}
			});
		})
		.then(function() {
			return appserver.stop();
		});
};

module.exports = RunWindowsTask;
