'use strict';

var RunTask = cb_require('tasks/run'),
	BuildIosTask = require('./build-ios'),
	shelljs = require('shelljs'),
	path = require('path');

class RunIosTask extends RunTask {

	run(cloudbridge, argv) {
		var project = this.project.data(),
			packagePath = path.join(this.projectDir, 'src', 'ios', 'build', 'Release-iphoneos', project.name + '.app');

		return this.build(argv)
			.then(() => {
				let out = shelljs.exec('ios-deploy -c').stdout,
					device = out.replace('[\.\.\.\.] Waiting up to 5 seconds for iOS device to be connected\n', '');

				return device;
			})
			.then((targetDevice) => {
				var flags = '',
					debug = false;

				console.log('\n');
				console.log('targetDevice', targetDevice);
				console.log('\n');

				if (targetDevice.length === 0) {
					throw new Error('No devices found.');
				}

				for (let i = 2; i < argv._.length; i++) {
					switch (argv._[i].toUpperCase()) {
						case 'DEBUG':
						case 'D':
							flags += ' -d';
							debug = true;
							break;

						case 'ID':
							if (argv._.length >= i + 1) {
								if (targetDevice.indexOf(argv._[i + 1]) > -1) {
									flags += ' --id ' + argv._[i + 1];
									i++;
									break;
								}
								throw new Error('Device (' + argv._[i + 1] + ') not found.');
							}
							throw new Error('Invalid command arguments.');
					}
				}

				if (!debug)
					flags += ' --justlaunch';

				return shelljs.exec('ios-deploy -b ' + packagePath + flags);
			});
	}

	build(argv) {
		let task = new BuildIosTask(this.options);

		return task.run(cli, argv);
	}

}

module.exports = RunIosTask;
