'use strict';

var PlatformTask = cb_require('tasks/platform'),
	utils = cb_require('utils/utils'),
	path = require('path'),
	shelljs = require('shelljs'),
	Q = require('q');

var PlatformRemoveTask = function() {

};

PlatformRemoveTask.prototype = new PlatformTask();

PlatformRemoveTask.prototype.run = function run(cloudbridge, argv) {
	var _this = this,
		platforms = _this.getPlatforms(argv);

	if (platforms.length === 0) {
		throw new Error("Invalid platform!");
	}

	return platforms.reduce(function(promise, platform, index) {
		var options = {
			platform: platform,
			package: 'cloudbridge-kit-' + platform,
			project: {
				dir: cloudbridge.projectDir,
				data: _this.project.data()
			}
		};

		return promise
			.then(function() {
				return utils.fetchPackage(options);
			})
			.then(function(packageDir) {
				options.src = packageDir;

				return _this.remove(options);
			})
			.then(function() {
				return _this.save(options);
			});

	}, Q());
};

PlatformRemoveTask.prototype.remove = function install(options) {
	return this.execute('remove', options);
};


PlatformRemoveTask.prototype.save = function save(options) {
	var platformData = this.project.get('platform') || {};

	delete platformData[options.platform];

	this.project.set('platform', platformData);
	this.project.save();

	console.log('The platform "' + options.platform + '" has been successfully removed from your project!');
};

module.exports = PlatformRemoveTask;
