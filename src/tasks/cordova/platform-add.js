'use strict';

var PlatformTask = require('./platform'),
	Package = cb_require('utils/package'),
	Q = require('q'),
	path = require('path'),
	shelljs = require('shelljs');

class PlatformAddTask extends PlatformTask {

	run(cloudbridge, argv) {
		var _this = this,
			platforms = _this.getPlatforms(argv);

		if (platforms.length === 0) {
			throw new Error("Invalid platform!");
		}

		var projectData = this.project.data();

		return platforms.reduce(function(promise, platform, index) {
			var options;
			if (platform == "android" || platform == "ios") {
				options = {
					platform: platform,
					package: 'cloudbridge-kit-' + platform + '-cdv'
				};
			}
			else {
				options = {
					platform: platform,
					package: 'cloudbridge-kit-' + platform
				};
			}

			var pack = new Package(options.package);

			return promise
				.then(function() {
					return pack.latest();
				})
				.then(function() {
					options.version = '^' + pack.version;

					return pack.fetch();
				})
				.then(function() {
					return pack.install(_this.projectDir, projectData);
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

		console.log('\nThe platform ' + options.platform.bold + ' has been successfully added to your project!');
	}

}

module.exports = PlatformAddTask;
