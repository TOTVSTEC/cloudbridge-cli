'use strict';

var AppTask = cb_require('tasks/app-task'),
	bower = cb_require('utils/bower'),
	shelljs = require('shelljs'),
	path = require('path'),
	fs = require('fs'),
	wiredep = require('wiredep'),
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
		bowerComponents = this.project.get('bowerComponents') || {},
		options;

	if (!main)
		return;

	options = {
		cwd: this.projectDir,
		src: path.join(this.projectDir, main),
		directory: path.join(this.projectDir, 'build', 'bower'),
		ignorePath: /^.*?\/build\//ig,
		bowerJson: {
			dependencies: bowerComponents
		},
		onError: function(err) {
			console.log("onError", err, err.code);

			// If not overridden, an error will throw.

			// err = Error object.
			// err.code can be:
			//   - "PKG_NOT_INSTALLED" (a Bower package was not found)
			//   - "BOWER_COMPONENTS_MISSING" (cannot find the `bower_components` directory)
		},

		onFileUpdated: function(filePath) {
			console.log("onFileUpdated", filePath);

			// filePath = 'name-of-file-that-was-updated'
		},

		onPathInjected: function(fileObject) {
			console.log("onPathInjected", fileObject);

			// fileObject.block = 'type-of-wiredep-block' ('js', 'css', etc)
			// fileObject.file = 'name-of-file-that-was-updated'
			// fileObject.path = 'path-to-file-that-was-injected'
		},

		onMainNotFound: function(pkg) {
			console.log("onMainNotFound", pkg);

			// pkg = 'name-of-bower-package-without-main'
		}
	};


	wiredep(options);
};

/*
BowerTask.prototype.updateMain = function updateMain() {
	var main = this.project.get('main'),
		content = null,
		matches = [];

	if (main === undefined) {
		return;
	}

	main = path.join(this.projectDir, main);

	if (shelljs.test('-f', main)) {
		content = fs.readFileSync(main, { encoding: 'utf8' });
	}

	if (content === null)
		return;

	//var matches = (/(<!-- bower:.* -->)/igm).exec(content);
	// (?:<!-- bower:)(.*)(?: -->(?:\r?\n|.)*?<!-- endbower -->)
	//'<!-- endbower -->'

	var regexp = /(?:<!-- bower:(.*) -->)([\s\S]*?)(?:<!-- endbower -->)/igm,
		match = null;


	while (match = regexp.exec(content)) {
		matches.push(match);
	}

	if (matches.length === 0)
		return;


	return bower.list()
		.then(function(result) {
			console.log(result);

			var from = path.parse(main).dir;

			Object.keys(result).forEach(function(key, index) {
				var to = path.join(process.cwd(), result[key]);

				console.log(path.relative(from, to));
			});

		});
};
*/

module.exports = BowerTask;
