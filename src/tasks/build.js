'use strict';

var AppTask = cb_require('tasks/app-task'),
	path = require('path'),
	shelljs = require('shelljs'),
	Q = require('q'),
	resources = cb_require('utils/resources');

var utils = cli.utils;

var BuildTask = function() { };
BuildTask.prototype = new AppTask();

BuildTask.prototype.run = function run(cloudbridge, argv) {
	cloudbridge.projectDir = process.cwd();

	var isWindows = argv._.indexOf('windows') != -1;
	var isAndroid = argv._.indexOf('android') != -1;
	var task = null;

	if (isAndroid) {
		var BuildAndroidTask = require('./build-android');
		task = new BuildAndroidTask();

		return task.run(cloudbridge, argv);
	}
	else {
		//if ((isWindows) || (!isWindows && !isAndroid)) {
		var BuildWindowsTask = require('./build-windows');
		task = new BuildWindowsTask();

		return task.run(cloudbridge, argv);
	}
};

module.exports = BuildTask;
