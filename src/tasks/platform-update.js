'use strict';

var PlatformTask = cb_require('tasks/platform'),
	Package = cb_require('utils/package'),
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
				console.log("No platforms has been added to project.");
				return Q();
			}
		}

		return platforms.reduce(function(promise, platform, index) {
			var options = {
				platform: platform.name,
				version: platform.version,
				package: 'cloudbridge-kit-' + platform.name
			};

			var pack = new Package(options.package, null, options.version);

			return promise
				.then(function() {
					return pack.fetch();
				})
				.then(function() {
					return pack.update(_this.projectDir, projectData);
				})
				.then(function() {
					if (_this.options.save)
						return _this.save(options);
				})
				.then(function() {
					if (!_this.options.silent)
						console.log('\nThe platform ' + options.platform.bold + ' has been updated to version ' + options.version.bold + '!');
				});
		}, Q());
	}

	save(options) {
		var platformData = this.project.get('platform') || {};
		platformData[options.platform] = options.version || 'master';

		this.project.set('platform', platformData);
		this.project.save();
	}
}

module.exports = PlatformUpdateTask;

