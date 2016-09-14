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
			_this.save(packages, result);

			//TODO: delete component from main html
		});
};

BowerRemoveTask.prototype.save = function save(packages, bowerResult) {
	var bowerComponents = this.project.get('bowerComponents') || {},
		message = '';

	for (var i = 0; i < packages.length; i++) {
		var name = packages[i].replace(/#.*/, '');

		if (bowerComponents[name]) {
			delete bowerComponents[name];

			message += 'The bower package ' + name.bold + ' has been removed from your project!\n';
		}
	}

	this.project.set('bowerComponents', bowerComponents);
	this.project.save();

	if (message !== '') {
		console.log('\n' + message);
	}
};

module.exports = BowerRemoveTask;
