'use strict';

var PlatformTask = cb_require('tasks/platform'),
	utils = cb_require('utils/utils'),
	Package = cb_require('utils/package'),
	path = require('path'),
	shelljs = require('shelljs'),
	Q = require('q');

class PlatformUpdateTask extends PlatformTask {

	run(cloudbridge, argv) {
		var platforms = this.getPlatforms(argv);

		return this.update(platforms);
	}

	update(platforms) {
		var _this = this,
			projectData = this.project.data();

		if (platforms.length === 0) {
			platforms = Object.keys(this.project.get('platform') || {});

			if (platforms.length === 0) {

			}
		}

		return platforms.reduce(function(promise, platform, index) {
			var options = {
				platform: platform,
				package: 'cloudbridge-kit-' + platform
			};

			var pack = new Package(options.package);

			return promise
				.then(function() {
					return pack.latest();
				})
				.then(function() {
					options.version = pack.version;

					return pack.fetch();
				})
				.then(function() {
					return pack.update(_this.projectDir, projectData);
				})
				.then(function() {
					return _this.save(options);
				});
		}, Q());
	}

	save(options) {
		var platformData = this.project.get('platform') || {};
		platformData[options.platform] = options.version || 'master';

		this.project.set('platform', platformData);
		this.project.save();

		console.log('\nThe platform ' + options.platform.bold + ' has been updated to version ' + options.version + '!');
	}
}

module.exports = PlatformUpdateTask;

