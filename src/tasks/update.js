'use strict';

var AppTask = cb_require('tasks/app-task'),
	Package = cb_require('utils/package'),
	bower = cb_require('utils/bower'),
	svu = cb_require('utils/semver'),
	inquirer = require('inquirer'),
	_s = require('underscore.string'),
	Q = require('q');

var BowerUpdateTask = cb_require('tasks/bower-update'),
	PlatformUpdateTask = cb_require('tasks/platform-update'),
	AdvplUpdateTask = cb_require('tasks/advpl-update');

let taskOptions = { silent: false, save: false };

class UpdateTask extends AppTask {

	constructor(options) {
		super(options);

		taskOptions.target = options.target;
	}

	run(cloudbridge, argv) {
		var _this = this,
			project = this.project.data(),
			components = project.components || {};

		this.packages = {
			platform: this.getPackages(project.platform || {}),
			bower: this.getPackages(components.bower || {}),
			advpl: this.getPackages(components.advpl || {})
		};

		return _this.checkBower()
			.then(function() {
				return _this.checkPlatforms();
			})
			.then(function() {
				return _this.checkAdvpl();
			})
			.then(function() {
				return _this.showPrompt();
			});
	}

	getPackages(components) {
		return Object.keys(components).map(function(name) {
			return {
				name: name,
				current: svu.removeModifier(components[name]),
				modifier: svu.modifier(components[name])
			};
		});
	}

	checkBower() {
		var _this = this;

		return this.packages.bower.reduce(function(promise, pack, index) {
			return promise
				.then(function(result) {
					return bower.info(pack.name);
				})
				.then(function(result) {
					_this.packages.bower[index].latest = svu.removeModifier(result.latest.version);
				})
				.catch(function(error) {
					console.log(error);
				});
		}, Q());
	}

	checkPlatforms() {
		var _this = this;

		return this.packages.platform.reduce(function(promise, platform, index) {
			var pack = new Package('cloudbridge-kit-' + platform.name);

			return promise
				.then(function() {
					return pack.latest();
				})
				.then(function(latest) {
					_this.packages.platform[index].latest = svu.removeModifier(latest);
				})
				.catch(function(error) {
					console.log(error);
				});
		}, Q());
	}

	checkAdvpl() {
		var _this = this;

		return this.packages.advpl.reduce(function(promise, item, index) {
			var pack = new Package(item.name);

			return promise
				.then(function() {
					return pack.latest();
				})
				.then(function(latest) {
					_this.packages.advpl[index].latest = svu.removeModifier(latest);
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
			advplChoices,
			line,
			_this = this;

		platformChoices = this.createChoices('platform', longest);
		bowerChoices = this.createChoices('bower', longest);
		advplChoices = this.createChoices('advpl', longest);

		line = Math.max.apply(Math, bowerChoices.concat(platformChoices).concat(advplChoices).map(function(item) {
			return item.name.stripColors.length;
		}));

		if (platformChoices.length > 0) {
			choices.push(this.createSeparator('Platforms', line));
			choices = choices.concat(platformChoices);
		}

		if (bowerChoices.length > 0) {
			choices.push(this.createSeparator('Bower Components', line));
			choices = choices.concat(bowerChoices);
		}

		if (advplChoices.length > 0) {
			choices.push(this.createSeparator('AdvPL Components', line));
			choices = choices.concat(advplChoices);
		}

		if (choices.length === 0) {
			console.log('\nAll dependencies match the latest package versions!');
			return Q();
		}

		return inquirer.prompt([{
			type: 'checkbox',
			name: 'updates',
			message: 'Select the updates',
			choices: choices,
			pageSize: 20
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
				if (components.platform.length > 0)
					return _this.updatePlatform(components.platform);
			})
			.then(function() {
				if (components.bower.length > 0)
					return _this.updateBower(components.bower);
			})
			.then(function() {
				if (components.advpl.length > 0)
					return _this.updateAdvpl(components.advpl);
			})
			.then(function() {
				_this.save(components);
			});
	}

	updatePlatform(components) {
		var task = new PlatformUpdateTask(taskOptions),
			list = components.map(function(pack) {
				return {
					name: pack.name,
					version: pack.modifier + pack.latest
				};
			});

		return task.update(list);
	}

	updateBower(components) {
		return this.updateComponents(components, BowerUpdateTask);
	}

	updateAdvpl(components) {
		return this.updateComponents(components, AdvplUpdateTask);
	}

	updateComponents(components, TaskClass) {
		var task = new TaskClass(taskOptions),
			list = {};

		for (var i = 0; i < components.length; i++) {
			var pack = components[i];

			list[pack.name] = pack.modifier + pack.latest;
		}

		return task.update(list);
	}

	save(updates) {
		var components = this.project.get('components') || {},
			platforms = this.project.get('platform') || {};

		Object.keys(updates).forEach(function(type, index) {
			updates[type].forEach(function(update, index) {
				if (type === 'platform') {
					platforms[update.name] = update.modifier + update.latest;
				}
				else {
					components[type][update.name] = update.modifier + update.latest;
				}
			});
		});

		this.project.set('components', components);
		this.project.set('platform', platforms);
		this.project.save();
	}

	createSeparator(name, size) {
		var text = _s.lrpad(' ' + name + ' ', size + 4, '─');

		return new inquirer.Separator(text);
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
				continue;
			}

			var majorZero = (svu.semver.major(pack.current) === 0),
				satisfies = (svu.semver.satisfies(pack.latest, pack.modifier + pack.current, true));

			var name = _s.rpad(pack.name, longest.name),
				current = _s.lpad(pack.modifier + pack.current, longest.current),
				latest = _s.lpad(pack.modifier + pack.latest, longest.latest);

			var choice = {
				name: name + '  ' + current + '  ->  ' + latest,
				value: Object.assign({ type: packageType }, pack)
			};

			if (majorZero || !satisfies) {
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
			return item.current.length + item.modifier.length;
		}));

		result.latest = Math.max.apply(Math, items.map(function(item) {
			return item.latest.length + item.modifier.length;
		}));

		return result;
	}

}

module.exports = UpdateTask;
