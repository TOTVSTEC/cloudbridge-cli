'use strict';

var BowerAddTask = cb_require('tasks/bower'),
	path = require('path'),
	bower = cb_require('utils/bower'),
	Q = require('q');

class BowerRestoreTask extends BowerAddTask {

	constructor(options) {
		super(options);

		this.silent = true;
	}

	run(cloudbridge, argv) {
		var components = this.project.get('components') || {},
			bowerComponents = components.bower || {},
			config = { directory: path.join(this.projectDir, 'build', 'bower') },
			packages = Object.keys(bowerComponents);

		if (packages.length > 0) {
			console.log('\nRestoring bower components...');
		}

		return packages.reduce(function(promise, name, index) {
			var version = bowerComponents[name].trim().replace(/^[\^~v=\s]+/ig, '');

			console.log('  ' + name.bold + ' ' + version);

			return bower.install([name + '#' + version], null, config);
		}, Q());
	}
}

module.exports = BowerRestoreTask;
