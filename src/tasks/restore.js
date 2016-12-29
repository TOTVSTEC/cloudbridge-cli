'use strict';

var AppTask = cb_require('tasks/app-task'),
	Package = cb_require('utils/package'),
	PlatformRestoreTask = cb_require('tasks/platform-restore'),
	BowerRestoreTask = cb_require('tasks/bower-restore'),
	path = require('path'),
	Q = require('q');

class RestoreTask extends AppTask {

	run(cloudbridge, argv) {
		let _this = this,
			platformTask = new PlatformRestoreTask(cloudbridge, argv),
			bowerTask = new BowerRestoreTask(cloudbridge, argv);

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
			pack = new Package({
				name: 'cloudbridge-app-base',
				version: projectData.lib || projectData.bowerComponents['totvs-twebchannel']
			});

		if (pack.version === 'master') {
			promise = pack.latest();
		}
		else {
			promise = Q();
		}

		if (!projectData.lib) {
			promise.then(function() {
				projectData.lib = pack.version;

				_this.project.set('cloudbridge-core', pack.version);
				_this.project.save();
			});
		}

		return promise
			.then(function() {
				return pack.fetch();
			})
			.then(function() {
				console.log('\nRestoring AdvPL Core...');
				console.log('  ' + 'cloudbridge-core'.bold + ' ' + pack.version);

				return pack.restore(_this.projectDir, projectData);
			});
	}
}

module.exports = RestoreTask;
