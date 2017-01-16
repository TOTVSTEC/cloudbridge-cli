'use strict';

var AppTask = cb_require('tasks/app-task'),
	Package = cb_require('utils/package'),
	bower = cb_require('utils/bower'),
	path = require('path'),
	semver = cb_require('utils/semver'),
	inquirer = require('inquirer'),
	_s = require('underscore.string'),
	Q = require('q');

var BowerAddTask = cb_require('tasks/bower-add'),
	BowerRemoveTask = cb_require('tasks/bower-remove'),
	PlatformUpdateTask = cb_require('tasks/platform-update');

class UpdateTask extends AppTask {

	constructor() {
		super();

		this.fixProject();
	}



	run(cloudbridge, argv) {
		var _this = this,
			project = this.project.data(),
			components = project.components || {};

		this.packages = {};
		this.packages.bower = this.getPackages(components.bower || {});
		this.packages.platform = this.getPackages(project.platform || {});
		this.packages.core = this.getPackages(components.advpl || {});

		return _this.bower()
			.then(function() {
				return _this.platforms();
			})
			.then(function() {
				return _this.core();
			})
			.then(function() {
				return _this.showPrompt();
			});
	}

	getPackages(components) {
		var _this = this;

		return Object.keys(components).map(function(name) {
			return {
				name: name,
				current: _this.semverClean(components[name])
			};
		});

	}

	bower() {
		var _this = this;

		return this.packages.bower.reduce(function(promise, pack, index) {
			return promise
				.then(function(result) {
					return bower.info(pack.name);
				})
				.then(function(result) {
					_this.packages.bower[index].latest = _this.semverClean(result.latest.version);
				})
				.catch(function(error) {
					console.log(error);
				});
		}, Q());
	}

	platforms() {
		var _this = this;

		return this.packages.platform.reduce(function(promise, platform, index) {
			var pack = new Package('cloudbridge-kit-' + platform.name);

			return promise
				.then(function() {
					return pack.latest();
				})
				.then(function(latest) {
					_this.packages.platform[index].latest = _this.semverClean(latest);
				})
				.catch(function(error) {
					console.log(error);
				});
		}, Q());
	}

	core() {
		var _this = this;

		return this.packages.core.reduce(function(promise, item, index) {
			var pack = new Package(item.name);

			return promise
				.then(function() {
					return pack.latest();
				})
				.then(function(latest) {
					_this.packages.core[index].latest = _this.semverClean(latest);
				})
				.catch(function(error) {
					console.log(error);
				});
		}, Q());
	}

	showPrompt() {
		var longest = this.getLongests(),
			choices = [],
			bowerChoices,
			platformChoices,
			coreChoices,
			line,
			_this = this;

		bowerChoices = this.createChoices('bower', longest);
		platformChoices = this.createChoices('platform', longest);
		coreChoices = this.createChoices('core', longest);

		line = Math.max.apply(Math, bowerChoices.concat(platformChoices).map(function(item) {
			return item.name.stripColors.length;
		}));

		console.log(line);

		if (bowerChoices.length > 0) {
			choices.push(this.createSeparator('Bower Components', line));
			choices = choices.concat(bowerChoices);
		}

		if (platformChoices.length > 0) {
			choices.push(this.createSeparator('Platforms', line));
			choices = choices.concat(platformChoices);
		}

		if (coreChoices.length > 0) {
			choices.push(this.createSeparator('Core', line));
			choices = choices.concat(coreChoices);
		}

		return inquirer.prompt([{
			type: 'checkbox',
			name: 'updates',
			message: 'Select the updates',
			choices: choices
		}]).then(function(answers) {
			return _this.update(answers.updates);
		});
	}

	update(updates) {
		var components = {},
			_this = this;

		Object.keys(this.packages).forEach(function(key, index) {
			components[key] = updates.filter(function(update) {
				return update.type === key;
			});
		});

		return Q()
			.then(function() {
				if (components.bower.length > 0)
					return _this.updateBower(components.bower);
			})
			.then(function() {
				if (components.platform.length > 0)
					return _this.updatePlatform(components.platform);
			})
			.then(function(answers) {
				if (components.core.length > 0)
					return _this.updateCore(components.core);
			});
	}

	updateBower(components) {
		var removeTask = new BowerRemoveTask({ silent: true }),
			addTask = new BowerAddTask({ silent: true }),
			list = components.map(function(pack) {
				return pack.name;
			});

		return removeTask.uninstall(list)
			.then(function(result) {
				list = components.map(function(pack) {
					return pack.name + "@" + pack.latest;
				});

				return addTask.install(list);
			})
			.then(function(result) {
				console.log('Bower Components updated!');
			});
	}

	updatePlatform(components) {
		var task = new PlatformUpdateTask({ silent: true }),
			list = components.map(function(pack) {
				return pack.name;
			});

		return task.update(list)
			.then(function(result) {
				//console.log('Platforms updated!');
			});
	}

	updateCore(components) {
		var _this = this;

		return components.reduce(function(promise, update, index) {
			var pack = new Package(update.name, null, update.latest);

			return promise
				.then(function() {
					return pack.fetch();
				})
				.then(function() {
					return pack.update(_this.projectDir, _this.project.data());
				})
				.then(function() {
					var components = _this.project.data().components || {};

					if (!components.advpl)
						components.advpl = {};

					components.advpl[update.name] = update.latest;

					_this.project.set('components', components);
					_this.project.save();

					console.log('\nThe component ' + update.name.bold + ' has been updated to version ' + update.latest.bold + '!');
				});
		}, Q());
	}

	createSeparator(name, size) {
		var text = _s.lrpad(' ' + name + ' ', size + 4, '─');

		return new inquirer.Separator(text);
	}

	semverClean(version) {
		return version.trim().replace(/^[\^~v=\s]+/ig, '');
	}

	createChoices(packageType, longest) {
		var choices = [],
			packages = this.packages[packageType];

		if (!Array.isArray(packages)) {
			packages = [packages];
		}

		for (var i = 0; i < packages.length; i++) {
			var pack = packages[i];

			if (pack.current === pack.latest) {
				//continue;
			}

			var name = _s.rpad(pack.name, longest.name),
				current = _s.lpad(pack.current, longest.current),
				latest = _s.lpad(pack.latest, longest.latest);

			var choice = {
				name: name + '  ' + current + '  ->  ' + latest,
				value: Object.assign({ type: packageType }, pack)
			};

			//choice.value.type = packageType;

			if (!semver.satisfies(pack.latest, pack.current, true)) {
				choice.name = choice.name.yellow.bold;
			}

			choices.push(choice);
		}

		return choices;
	}

	getLongests() {
		var items = [],
			result = {};

		Object.keys(this.packages).forEach(function(key, index) {
			if (typeof this.packages[key] === 'string') {
				items.push(this.packages[key]);
			}
			else {
				items = items.concat(this.packages[key]);
			}
		}.bind(this));

		result.name = Math.max.apply(Math, items.map(function(item) {
			return item.name.length;
		}));

		result.current = Math.max.apply(Math, items.map(function(item) {
			return item.current.length;
		}));

		result.latest = Math.max.apply(Math, items.map(function(item) {
			//return (item.latest || "1.0.0").length;
			return item.latest.length;
		}));

		return result;
	}

}

module.exports = UpdateTask;
