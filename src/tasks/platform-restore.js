'use strict';

var AppTask = cb_require('tasks/app-task'),
	Package = cb_require('utils/package'),
	path = require('path'),
	Q = require('q');

class PlatformRestoreTask extends AppTask {

	run(cloudbridge, argv) {
		let _this = this,
			projectData = this.project.data(),
			platforms = Object.keys(projectData.platform);

		return platforms.reduce(function(promise, platform, index) {
			var pack = new Package({
				name: 'cloudbridge-kit-' + platform,
				version: projectData.platform[platform]
			});

			return promise
				.then(function() {
					return pack.fetch();
				})
				.then(function() {
					console.log('\nRestoring platform ' + platform.bold + '...');

					return pack.restore(_this.projectDir, projectData);
				});
		}, Q());

	}
}

module.exports = PlatformRestoreTask;
