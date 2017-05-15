'use strict';

var AppTask = cb_require('tasks/app-task'),
	Package = cb_require('utils/package'),
	PlatformRestoreTask = cb_require('tasks/platform-restore'),
	BowerRestoreTask = cb_require('tasks/bower-restore'),
	Q = require('q');

class RestoreTask extends AppTask {

	run(cloudbridge, argv) {
		let _this = this,
			platformTask = new PlatformRestoreTask(this.options),
			bowerTask = new BowerRestoreTask(this.options);

		return platformTask.run(cloudbridge, argv)
			.then(function() {
				return _this.restoreCore();
			})
			.then(function() {
				return bowerTask.run(cloudbridge, argv);
			});
	}

	restoreCore() {
		var _this = this,
			projectData = this.project.data(),
			promise,
			components = projectData.components.advpl,
			keys = Object.keys(components);

		if (keys.length > 0) {
			console.log('\nRestoring AdvPL components...');
		}

		return keys.reduce(function(promise, item, index) {
			var pack = new Package(item, null, components[item]);

			return promise
				.then(function() {
					return pack.fetch();
				})
				.then(function() {
					console.log('  ' + pack.name.bold + ' ' + pack.version);

					return pack.restore(_this.projectDir, projectData);
				});
		}, Q());
	}
}

module.exports = RestoreTask;
