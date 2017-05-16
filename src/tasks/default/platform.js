'use strict';

var AppTask = require('./app-task'),
	path = require('path'),
	platforms = cb_require('utils/platform'),
	utils = cli.utils;

const DEFAULT_OPTIONS = {
	save: true,
	silent: false
};

class PlatformTask extends AppTask {

	constructor(options) {
		super(Object.assign({}, DEFAULT_OPTIONS, options || {}));
	}

	run(cloudbridge, argv) {
		try {
			var isAddCmd = argv._.indexOf('add') !== -1;
			var isRmCmd = argv._.indexOf('rm') !== -1 || argv._.indexOf('remove') !== -1;
			var isUpdateCmd = argv._.indexOf('up') !== -1 || argv._.indexOf('update') !== -1;

			var task = null;

			if (isAddCmd) {
				var PlatformAddTask = require('./platform-add');

				task = new PlatformAddTask(this.options);
			}
			else if (isRmCmd) {
				var PlatformRemoveTask = require('./platform-remove');

				task = new PlatformRemoveTask(this.options);
			}
			else if (isUpdateCmd) {
				var PlatformUpdateTask = require('./platform-update');

				task = new PlatformUpdateTask(this.options);
			}

			if (task === null) {
				return require('q').reject('Invalid Command');
			}

			return task.run(cloudbridge, argv);
		}
		catch (ex) {
			utils.fail('An error occurred on platform task:' + ex);
		}
	}

	execute(action, options) {
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
	}

	getPlatforms(argv) {
		var validPlatforms = [];

		for (var i = 0; i < platforms.all.length; i++) {
			var platform = platforms.all[i];

			if (argv._.indexOf(platform) !== -1)
				validPlatforms.push(platform);
		}

		return validPlatforms;
	}

}

module.exports = PlatformTask;
