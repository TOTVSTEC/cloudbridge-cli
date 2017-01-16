'use strict';

var BowerTask = cb_require('tasks/bower'),
	path = require('path'),
	bower = cb_require('utils/bower');

var BowerRemoveTask = function(options) {
	options = options || {};

	this.silent = options.silent || false;
	this.projectDir = options.target || process.cwd();
};

BowerRemoveTask.prototype = new BowerTask();

BowerRemoveTask.prototype.run = function(cloudbridge, argv) {
	var packages = this.getPackages(argv);

	return this.uninstall(packages);
};

BowerRemoveTask.prototype.uninstall = function uninstall(packages) {
	var _this = this;

	return bower.uninstall(packages)
		.then(function(result) {
			_this.save(packages, result);

			//TODO: delete component from main html
		});
};



BowerRemoveTask.prototype.save = function save(packages, bowerResult) {
	var components = this.project.get('components') || {},
		bowerComponents = components.bower || {},
		message = '';

	for (var i = 0; i < packages.length; i++) {
		var name = packages[i].replace(/#.*/, '');

		if (bowerComponents[name]) {
			delete bowerComponents[name];

			if (!this.silent)
				message += 'The bower package ' + name.bold + ' has been removed from your project!\n';
		}
	}

	components.bower = bowerComponents;

	this.project.set('components', components);
	this.project.save();

	if (message !== '') {
		console.log('\n' + message);
	}
};

module.exports = BowerRemoveTask;
