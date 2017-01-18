'use strict';

var BowerTask = cb_require('tasks/bower'),
	path = require('path'),
	bower = cb_require('utils/bower'),
	BowerAddTask = cb_require('tasks/bower-add'),
	BowerRemoveTask = cb_require('tasks/bower-remove');

class BowerUpdateTask extends BowerTask {

	run(cloudbridge, argv) {
		var packages = this.getPackages(argv);

		return this.update(packages);
	}

	update(packages) {
		var _this = this,
			config = { directory: path.join(this.projectDir, 'build', 'bower') };

		var removeTask = new BowerRemoveTask({ silent: true }),
			addTask = new BowerAddTask({ silent: true }),
			list = Object.keys(packages);

		return removeTask.uninstall(list)
			.then(function(result) {
				list = Object.keys(packages).map(function(name) {
					return name + "@" + packages[name];
				});

				return addTask.install(list);
			});
	}


}

module.exports = BowerUpdateTask;
