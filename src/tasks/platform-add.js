var PlatformTask = cb_require('tasks/platform'),
	utils = cb_require('utils/utils'),
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

				return _this.install(options);
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
	platformData[options.platform] = {
		version: options.version
	};

	this.project.set('platform', platformData);
	this.project.save();

	console.log('The platform "' + options.platform + '" has been successfully added to your project!');
};

module.exports = PlatformAddTask;
