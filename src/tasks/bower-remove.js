'use strict';

var BowerTask = cb_require('tasks/bower'),
	path = require('path'),
	bower = cb_require('utils/bower');

var BowerRemoveTask = function() {

};

BowerRemoveTask.prototype = new BowerTask();

BowerRemoveTask.prototype.run = function(cloudbridge, argv) {
	var _this = this,
		packages = this.getPackages(argv);

	return bower.uninstall(packages)
		.then(function(result) {
			//console.log(result);

			_this.save(packages, result);


			//TODO: delete component folter
			//TODO: delete component from main html
			//TODO: remove component cloudbridge.json

		});
};

BowerRemoveTask.prototype.save = function save(packages, bowerResult) {
	var bowerComponents = this.project.get('bowerComponents') || {},
		message = '';

	for (var i = 0; i < packages.length; i++) {
		if (bowerComponents[packages[i]]) {
			delete bowerComponents[packages[i]];

			message += 'The bower package "' + packages[i] + '" has been removed from your project!\n';
		}
	}

	this.project.set('bowerComponents', bowerComponents);
	this.project.save();

	if (message !== '') {
		console.log('\n' + message);
	}
};

module.exports = BowerRemoveTask;
