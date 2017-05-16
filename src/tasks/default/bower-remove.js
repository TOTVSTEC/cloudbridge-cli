'use strict';

var BowerTask = require('./bower'),
	bower = cb_require('utils/bower');

class BowerRemoveTask extends BowerTask {

	run(cloudbridge, argv) {
		var packages = this.getPackages(argv);

		return this.uninstall(packages);
	}

	uninstall(packages) {
		return bower.uninstall(packages)
			.then((result) => {
				if (this.options.save)
					return this.save(packages, result);

				//TODO: delete component from main html
			});
	}

	save(packages, bowerResult) {
		var components = this.project.get('components') || {},
			bowerComponents = components.bower || {},
			message = '';

		for (var i = 0; i < packages.length; i++) {
			var name = packages[i].replace(/#.*/, '');

			if (bowerComponents[name]) {
				delete bowerComponents[name];

				if (!this.options.silent)
					message += 'The bower package ' + name.bold + ' has been removed from your project!\n';
			}
		}

		components.bower = bowerComponents;

		this.project.set('components', components);
		this.project.save();

		if (message !== '') {
			console.log('\n' + message);
		}
	}
}

module.exports = BowerRemoveTask;
