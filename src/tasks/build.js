var AppTask = cb_require('tasks/app-task'),
	path = require('path'),
	shelljs = require('shelljs'),
	Q = require('q'),
	resources = cb_require('utils/resources');

var utils = cli.utils;

var BuildTask = function() { };
BuildTask.prototype = new AppTask();

BuildTask.prototype.run = function run(cloudbridge, argv) {
	var android = require(__basedir + '/kits/android');

	return android.build(cloudbridge);
};

module.exports = BuildTask;
