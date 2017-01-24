'use strict';

var BowerTask = cb_require('tasks/bower'),
	path = require('path'),
	bower = cb_require('utils/bower');

class BowerAddTask extends BowerTask {

	run(cloudbridge, argv) {
		var packages = this.getPackages(argv);

		return this.install(packages);
	}

	install(packages) {
		var _this = this,
			config = { directory: path.join(this.projectDir, 'build', 'bower') };

		return bower.install(packages, null, config)
			.then(function(result) {
				if (_this.options.save)
					return _this.save(packages, result);
			})
			.then(function(result) {
				return _this.updateMain();
			});
	}

	save(packages, bowerResult) {
		var silent = this.options.silent,
			components = this.project.get('components') || {},
			bowerComponents = components.bower || {},
			originalData = this.objectify(packages),
			message = '';

		Object.keys(bowerResult).forEach(function(value, index) {
			var source = bowerResult[value].endpoint.source || value,
				version = bowerResult[value].pkgMeta.version,
				modifier = '^';

			if (originalData[source] !== '') {
				var m = originalData[source][0];
				if ((m === '^') || (m === '~'))
					modifier = m;
				else
					modifier = '';
			}

			bowerComponents[value] = modifier + version;

			if (!silent)
				message += 'The bower package ' + value.bold + '#' + version.bold + ' has been successfully added to your project!\n';
		});

		components.bower = bowerComponents;

		this.project.set('components', components);
		this.project.save();

		if (message !== '') {
			console.log('\n' + message);
		}
	}

	objectify(packages) {
		var result = {};

		for (var i = 0; i < packages.length; i++) {
			var element = this.split(packages[i]);

			result[element.name] = element.version;
		}

		return result;
	}

	split(data) {
		var splitter = data.indexOf('#') !== -1 ? '#' : data.indexOf('@')  !== -1 ? '@' : '',
			result = {};

		if (splitter !== '') {
			var parts = data.split(splitter);

			result.name = parts[0];
			result.version = parts[1];
		}
		else {
			result.name = data;
			result.version = '';
		}

		return result;
	}
}


module.exports = BowerAddTask;
