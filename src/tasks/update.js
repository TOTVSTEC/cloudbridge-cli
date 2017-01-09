'use strict';

var AppTask = cb_require('tasks/app-task'),
	bower = cb_require('utils/bower'),
	path = require('path'),
	inquirer = require('inquirer'),
	Q = require('q');

class UpdateTask extends AppTask {

	run(cloudbridge, argv) {
		var _this = this;

		this.packages = [];

		return _this.bower()
			.then(function() {
				return _this.showPrompt();
			});
	}

	bower() {
		var _this = this,
			components = ['totvs-twebchannel', 'bootstrap', 'jquery'];

		return components.reduce(function(promise, pack, index) {
			return bower.info(pack)
				.then(function(result) {
					_this.packages.push({
						type: 'bower',
						name: result.name,
						latest: result.latest.version
					});

					console.log(result.latest.name + ' ' + result.latest.version);
				})
				.catch(function(error) {
					console.log(error);
				});
		}, Q());
	}

	showPrompt() {

		var longest = Math.max.apply(Math, this.packages.map(function(el) {
			return el.name.length;
		}));

		/*
		var longest = this.packages.reduce(function(a, b) {
			return a.name.length > b.name.length ? a.name.length : b.name.length;
		});
		*/

		var choices = this.packages.map(function(value, index) {
			return {
				name: ' ' + value.name + Array(longest + 2 - value.name.length).join(' ') + ' 1.0.0  ->  ' + value.latest
			};
		});

		return inquirer.prompt([{
			type: 'checkbox',
			name: 'updates',
			message: 'Select the updates',
			choices: choices
		}]).then(function(answers) {

		});
	}

}

module.exports = UpdateTask;
