'use strict';

var BowerTask = cb_require('tasks/bower'),
	path = require('path'),
	bower = cb_require('utils/bower');

var BowerAddTask = function() {

};

BowerAddTask.prototype = new BowerTask();

BowerAddTask.prototype.run = function(cloudbridge, argv) {
	var _this = this,
		packages = this.getPackages(argv);

	return this.updateMain();

/*

	return bower.install(packages)
		.then(function(result) {
			//console.log(result);

			_this.save(packages, result);

			//TODO: add component to main html
		});
		*/
};

BowerAddTask.prototype.save = function save(packages, bowerResult) {
	var bowerComponents = this.project.get('bowerComponents') || {},
		message = '';

	for (var i = 0; i < packages.length; i++) {
		var name = packages[i];

		Object.keys(bowerResult).forEach(function(key, index) {
			var endpoint = bowerResult[key].endpoint;

			if (endpoint.source === name) {
				if (bowerComponents[name] === undefined) {
					var version = endpoint.target;
					bowerComponents[name] = version;

					message += 'The bower package "' + name + '#' + version + '" has been successfully added to your project!\n';
				}
			}
		});
	}

	this.project.set('bowerComponents', bowerComponents);
	this.project.save();

	if (message !== '') {
		console.log('\n' + message);
	}
};


module.exports = BowerAddTask;
