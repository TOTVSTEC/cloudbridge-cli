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
	var bowerComponents = this.project.get('bowerComponents') || {},
		message = '';

	for (var i = 0; i < packages.length; i++) {
		var name = packages[i].replace(/#.*/, '');

		Object.keys(bowerResult).forEach(function(key, index) {
			var endpoint = bowerResult[key].endpoint;

			if (endpoint.source === name) {
				if (bowerComponents[name] === undefined) {
					var version = endpoint.target;
					bowerComponents[name] = version;

					if (!this.silent)
						message += 'The bower package ' + name.bold + '#' + version.bold + ' has been successfully added to your project!\n';
				}
			}
		}.bind(this));
	}

	this.project.set('bowerComponents', bowerComponents);
	this.project.save();

	if (message !== '') {
		console.log('\n' + message);
	}
};


module.exports = BowerAddTask;
