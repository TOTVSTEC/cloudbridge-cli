'use strict';

var BowerTask = cb_require('tasks/bower'),
	path = require('path'),
	bower = cb_require('utils/bower');

var BowerAddTask = function(options) {
	options = options || {};

	this.silent = options.silent || false;
	this.projectDir = options.target || process.cwd();
};

BowerAddTask.prototype = new BowerTask();

BowerAddTask.prototype.run = function(cloudbridge, argv) {
	var packages = this.getPackages(argv);

	return this.install(packages);
};

BowerAddTask.prototype.install = function install(packages) {
	var _this = this,
		config = { directory: path.join(this.projectDir, 'build', 'bower') };

	return bower.install(packages, null, config)
		.then(function(result) {
			//console.log(result);

			return _this.save(packages, result);
		})
		.then(function(result) {
			return _this.updateMain();
		});
};

BowerAddTask.prototype.save = function save(packages, bowerResult) {
	var silent = this.silent,
		components = this.project.get('components') || {},
		bowerComponents = components.bower || {},
		message = '';

	Object.keys(bowerResult).forEach(function(value, index) {
		var version = bowerResult[value].pkgMeta.version;

		bowerComponents[value] = '^' + version;

		if (!silent)
			message += 'The bower package ' + value.bold + '#' + version.bold + ' has been successfully added to your project!\n';
	});

	components.bower = bowerComponents;

	this.project.set('components', components);
	this.project.save();

	if (message !== '') {
		console.log('\n' + message);
	}
};


module.exports = BowerAddTask;
