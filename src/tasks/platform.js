'use strict';

var AppTask = cb_require('tasks/app-task'),
	path = require('path'),
	utils = cli.utils;

var VALID_PLATFORMS = [
	'windows',
	'android',
	'ios'
];

var PlatformTask = function() { };
PlatformTask.prototype = new AppTask();

PlatformTask.prototype.run = function(cloudbridge, argv) {
	cloudbridge.projectDir = process.cwd();

	try {
		var isAddCmd = argv._.indexOf('add') != -1;
		var isRmCmd = argv._.indexOf('rm') != -1 || argv._.indexOf('remove') != -1;
		var isUpdateCmd = argv._.indexOf('up') != -1 || argv._.indexOf('update') != -1;

		var task = null;

		if (isAddCmd) {
			var PlatformAddTask = require('./platform-add');

			task = new PlatformAddTask();
		}
		else if (isRmCmd) {
			var PlatformRemoveTask = require('./platform-remove');

			task = new PlatformRemoveTask();
		}
		else if (isUpdateCmd) {
			var PlatformUpdateTask = require('./platform-update');

			task = new PlatformUpdateTask();
		}

		if (task === null) {
			return require('q').reject('Invalid Command');
		}

		return task.run(cloudbridge, argv);
	}
	catch (ex) {
		utils.fail('An error occurred on platform task:' + ex);
	}
};

PlatformTask.prototype.execute = function execute(action, options) {
	var task = null,
		moduleName = path.join(options.src, action);

	try {
		task = require(moduleName);
	}
	catch (error) {
		console.error(error);
	}

	if (task !== null) {
		return task.run(cli, options.project.dir);
	}
};

PlatformTask.prototype.getPlatforms = function getPlatforms(argv) {
	var platforms = [];

	for (var i = 0; i < VALID_PLATFORMS.length; i++) {
		var platform = VALID_PLATFORMS[i];

		if (argv._.indexOf(platform) != -1)
			platforms.push(platform);
	}

	return platforms;
};

module.exports = PlatformTask;
