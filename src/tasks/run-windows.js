'use strict';

var AppTask = cb_require('tasks/run'),
	path = require('path'),
	utils = cb_require('utils/utils'),
	appserver = cb_require('utils/appserver'),
	smartclient = cb_require('utils/smartclient');

var RunWindowsTask = function() {

};

RunWindowsTask.prototype = new AppTask();

RunWindowsTask.prototype.run = function run(cloudbridge, argv) {
	var projectDir = this.projectDir;

	return appserver.start(projectDir)
		.then(function() {
			return smartclient.run(projectDir);
		})
		.then(function() {
			return appserver.stop();
		});
};

module.exports = RunWindowsTask;
