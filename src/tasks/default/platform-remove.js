'use strict';

var PlatformTask = cb_require('tasks/platform'),
	Package = cb_require('utils/package'),
	Q = require('q');

class PlatformRemoveTask extends PlatformTask {

	run(cloudbridge, argv) {
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
					return pack.latest();
				})
				.then(function() {
					options.version = pack.version;

					return pack.fetch();
				})
				.then(function() {
					return pack.remove(_this.projectDir, projectData);
				})
				.then(function() {
					if (_this.options.save)
						return _this.save(options);
				});
		}, Q());
	}

	save(options) {
		var platformData = this.project.get('platform') || {};

		delete platformData[options.platform];

		this.project.set('platform', platformData);
		this.project.save();

		console.log('\nThe platform ' + options.platform.bold + ' has been successfully removed from your project!');
	}

}

module.exports = PlatformRemoveTask;
