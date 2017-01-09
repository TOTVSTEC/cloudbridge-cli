'use strict';

var AppTask = cb_require('tasks/app-task'),
	Package = cb_require('utils/package'),
	bower = cb_require('utils/bower'),
	path = require('path'),
	inquirer = require('inquirer'),
	Q = require('q');

class UpdateTask extends AppTask {

	run(cloudbridge, argv) {
		var _this = this,
			project = this.project.data();

		this.packages = {};

		this.packages.bower = Object.keys(project.bowerComponents).map(function(name) {
			return {
				name: name,
				current: project.bowerComponents[name]
			};
		});

		this.packages.platform = Object.keys(project.platform).map(function(name) {
			return {
				name: name,
				current: project.platform[name]
			};
		});

		return _this.bower()
			.then(function() {
				return _this.platforms();
			})
			.then(function() {
				return _this.showPrompt();
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
					_this.packages.bower[index].latest = result.latest.version;
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
					_this.packages.platform[index].latest = latest;
				})
				.catch(function(error) {
					console.log(error);
				});
		}, Q());
	}

	showPrompt() {
		var longest = this.getLongests(),
			choices = [],
			line = longest.name + longest.current + longest.latest + 10;

		choices.push(new inquirer.Separator(' '));
		choices.push(this.createSeparator('Bower Components', line));
		choices.push(new inquirer.Separator(' '));

		choices = choices.concat(this.packages.bower.map(function(value, index) {
			var name = value.name + Array(1 + longest.name - value.name.length).join(' '),
				current = Array(1 + longest.current - value.current.length).join(' ') + value.current,
				latest = Array(1 + longest.latest - value.latest.length).join(' ') + value.latest;

			return {
				name: name + '  ' + current + '  ->  ' + latest
			};
		}));

		choices.push(new inquirer.Separator(' '));
		choices.push(this.createSeparator('Platforms', line));
		choices.push(new inquirer.Separator(' '));

		choices = choices.concat(this.packages.platform.map(function(value, index) {
			var name = value.name + Array(1 + longest.name - value.name.length).join(' '),
				current = Array(1 + longest.current - value.current.length).join(' ') + value.current,
				latest = Array(1 + longest.latest - value.latest.length).join(' ') + value.latest;

			return {
				name: name + '  ' + current + '  ->  ' + latest
			};
		}));

		return inquirer.prompt([{
			type: 'checkbox',
			name: 'updates',
			message: 'Select the updates',
			choices: choices
		}]).then(function(answers) {

		});
	}

	createSeparator(name, size) {
		var line = Array(Math.floor(1 + (size - name.length) / 2)).join('─'),
			text = line + ' ' + name + ' ' +  line;

		if (name.length % 2)
			text += '─';

		return new inquirer.Separator(text);
	}

	getLongests() {
		var items = this.packages.bower.concat(this.packages.platform),
			result = {};

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
