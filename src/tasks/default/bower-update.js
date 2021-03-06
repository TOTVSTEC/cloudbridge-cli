'use strict';

var BowerTask = require('./bower'),
	BowerAddTask = require('./bower-add'),
	BowerRemoveTask = require('./bower-remove');

class BowerUpdateTask extends BowerTask {

	run(cloudbridge, argv) {
		var packages = this.getPackages(argv);

		return this.update(packages);
	}

	update(packages) {
		var removeTask = new BowerRemoveTask(this.options),
			addTask = new BowerAddTask(this.options),
			list = Object.keys(packages);

		return removeTask.uninstall(list)
			.then((result) => {
				var installList = list.map((name) => {
					return name + "#" + packages[name];
				});

				return addTask.install(installList);
			})
			.then((result) => {
				for (var i = 0; i < list.length; i++) {
					var name = list[i],
						version = packages[name];

					if (!this.options.silent)
						console.log('\nThe bower package ' + name.bold + ' has been updated to version ' + version.bold + '!');
				}
			});
	}

}

module.exports = BowerUpdateTask;
