'use strict';

var AppTask = cb_require('tasks/app-task'),
	bower = cb_require('utils/bower'),
	shelljs = require('shelljs'),
	path = require('path'),
	fs = require('fs'),
	utils = cli.utils;

var BowerTask = function() {

};

BowerTask.prototype = new AppTask();

BowerTask.prototype.run = function(cloudbridge, argv) {
	cloudbridge.projectDir = process.cwd();

	try {
		var isAddCmd = argv._.indexOf('add') != -1;
		var isRmCmd = argv._.indexOf('rm') != -1 || argv._.indexOf('remove') != -1;
		var task = null;

		if (isAddCmd) {
			var BowerAddTask = require('./bower-add'),

			task = new BowerAddTask();
		}
		else if (isRmCmd) {
			var BowerRemoveTask = require('./bower-remove');

			task = new BowerRemoveTask();
		}

		return task.run(cloudbridge, argv);
	}
	catch (ex) {
		utils.fail('An error occurred on platform task:' + ex);
	}
};

BowerTask.prototype.getPackages = function getPackages(argv) {
	var packages = [];
	var start = Math.max(argv._.indexOf('bower'),
		argv._.indexOf('add'),
		argv._.indexOf('rm'),
		argv._.indexOf('remove'));

	for (var i = start + 1; i < argv._.length; i++) {
		packages.push(argv._[i]);
	}

	return packages;
};

BowerTask.prototype.updateMain = function updateMain() {
	var main = this.project.get('main'),
		content = null,
		matches = null;

	if (main !== undefined) {
		main = path.join(this.projectDir, main);

		if (shelljs.test('-f', main)) {
			content = fs.readFileSync(main, {encoding: 'utf8'});
		}
	}

	if (content !== null) {
		var matches = (/(<!-- bower:.* -->)/igm).exec(content);
		//'<!-- endbower -->'

		if (matches.length === 0)
			return;

		//console.log(matches);
	}

	return bower.list()
		.then(function(result) {
			//console.log(result);

			var from = path.parse(main).dir;

			Object.keys(result).forEach(function(key, index) {
				var to = path.join(process.cwd(), result[key]);

				console.log(path.relative(from, to));
			});
		});
};

module.exports = BowerTask;
