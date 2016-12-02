'use strict';

var PlatformTask = cb_require('tasks/platform'),
	utils = cb_require('utils/utils'),
	Package = cb_require('utils/package'),
	path = require('path'),
	shelljs = require('shelljs'),
	Q = require('q');

var PlatformAddTask = function() {

};

PlatformAddTask.prototype = new PlatformTask();

PlatformAddTask.prototype.run = function run(cloudbridge, argv) {
	var _this = this,
		platforms = _this.getPlatforms(argv);

	if (platforms.length === 0) {
		throw new Error("Invalid platform!");
	}

	var projectData = this.project.data();

	return platforms.reduce(function(promise, platform, index) {
		var options = {
			platform: platform,
			package: 'cloudbridge-kit-' + platform
		};

		var pack = new Package(options.package);

		return promise
			.then(function() {
				return pack.latest()/*.catch(function() { })*/;
			})
			.then(function() {
				options.version = pack.version;

				return pack.fetch();
			})
			.then(function() {
				return pack.install(_this.projectDir, projectData);
			})
			.then(function() {
				return _this.save(options);
			});
	}, Q());
};

PlatformAddTask.prototype.install = function install(options) {
	return this.execute('install', options);
};

PlatformAddTask.prototype.save = function save(options) {
	var platformData = this.project.get('platform') || {};
	platformData[options.platform] = options.version || 'master';

	this.project.set('platform', platformData);
	this.project.save();

	console.log('\nThe platform ' + options.platform.bold + ' has been successfully added to your project!');
};

module.exports = PlatformAddTask;
