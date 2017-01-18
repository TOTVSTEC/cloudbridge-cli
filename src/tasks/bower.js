'use strict';

var AppTask = cb_require('tasks/app-task'),
	bower = cb_require('utils/bower'),
	shelljs = require('shelljs'),
	path = require('path'),
	fs = require('fs'),
	wiredep = require('wiredep'),
	utils = cli.utils;


class BowerTask extends AppTask {

	run(cloudbridge, argv) {
		cloudbridge.projectDir = process.cwd();

		try {
			var isAddCmd = argv._.indexOf('add') != -1;
			var isRmCmd = argv._.indexOf('rm') != -1 || argv._.indexOf('remove') != -1;
			var task = null;

			if (isAddCmd) {
				var BowerAddTask = require('./bower-add');

				task = new BowerAddTask();
			}
			else if (isRmCmd) {
				var BowerRemoveTask = require('./bower-remove');

				task = new BowerRemoveTask();
			}

			return task.run(cloudbridge, argv);
		}
		catch (ex) {
			utils.fail('An error occurred on bower task:' + ex);
		}
	}

	getPackages(argv) {
		var packages = [];
		var start = Math.max(argv._.indexOf('bower'),
			argv._.indexOf('add'),
			argv._.indexOf('rm'),
			argv._.indexOf('remove'));

		for (var i = start + 1; i < argv._.length; i++) {
			packages.push(argv._[i]);
		}

		return packages;
	}

	updateMain() {
		var main = this.project.get('main'),
			components = this.project.get('components') || {},
			bowerComponents = components.bower || {},
			bowerOverrides = this.project.get('bowerOverrides') || {},
			options;

		if (!main)
			return;

		options = {
			cwd: this.projectDir,
			src: path.join(this.projectDir, main),
			directory: path.join(this.projectDir, 'build', 'bower'),
			ignorePath: /^.*?\/build\//ig,
			bowerJson: {
				dependencies: bowerComponents,
				overrides: bowerOverrides
			}
		};


		wiredep(options);
	}
}

module.exports = BowerTask;
