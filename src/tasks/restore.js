'use strict';

var AppTask = cb_require('tasks/app-task'),
	Package = cb_require('utils/package'),
	PlatformRestoreTask = cb_require('tasks/platform-restore'),
	path = require('path'),
	Q = require('q');

class RestoreTask extends AppTask {

	run(cloudbridge, argv) {
		let _this = this,
			projectData = this.project.data(),
			task = new PlatformRestoreTask(cloudbridge, argv);

		return task.run(cloudbridge, argv)
			.then(function() {
				var promise,
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
						console.log('\nRestoring ' + 'cloudbridge-core'.bold + '...');

						return pack.restore(_this.projectDir, projectData);
					});
			});
	}
}

module.exports = RestoreTask;
