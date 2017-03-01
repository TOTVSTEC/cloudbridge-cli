'use strict';


let Q = require('q'),
	Task = cb_require('tasks/task'),
	project = cb_require('project/project'),
	svu = cb_require('utils/semver');

class AppTask extends Task {

	constructor(options) {
		super(options);

		this.options = options || {};

		this.projectDir = this.options.target || process.cwd();

		this.__project = null;
	}

	prepare() {
		return Q()
			.then(() => this.fixProjectV1())
			.then(() => this.fixProjectV2());
	}

	fixProjectV1() {
		var project = this.project.data(),
			components = project.components || {},
			platform = project.platform || {};

		if ((project.bowerComponents === undefined) && (Object.keys(components).length > 0)) {
			return;
		}

		components.bower = Object.assign({}, project.bowerComponents || {}, components.bower || {});
		components.advpl = components.advpl || {};

		this.project.remove('bowerComponents');

		if (!components.advpl['cloudbridge-core-advpl']) {
			if (components.bower['totvs-twebchannel'])
				components.advpl['cloudbridge-core-advpl'] = components.bower['totvs-twebchannel'];
			else
				components.advpl['cloudbridge-core-advpl'] = '0.0.0';
		}

		Object.keys(components).forEach(function(category) {
			Object.keys(components[category]).forEach(function(name) {
				var modifier = svu.modifier(components[category][name]) || '^';

				components[category][name] = modifier + svu.removeModifier(components[category][name]);
			});
		});

		Object.keys(platform).forEach(function(name) {
			var modifier = svu.modifier(platform[name]) || '^';
			platform[name] = modifier + svu.removeModifier(platform[name]);
		});

		this.project.set('components', components);
		this.project.set('platform', platform);
		this.project.save();
	}

	fixProjectV2() {
		var project = this.project.data(),
			components = project.components || {};

		if (components.bower['totvs-twebchannel']) {
			console.log('Updating your project to v2');
			console.log(' - Uninstaling ' + 'totvs-twebchannel'.bold);

			let BowerAddTask = cb_require('tasks/bower-add'),
				BowerRemoveTask = cb_require('tasks/bower-remove'),
				removeTask = new BowerRemoveTask({ silent: false }),
				addTask = new BowerAddTask({ silent: false }),
				removeList = ['totvs-twebchannel'],
				addList = ['cloudbridge-core-js#' + components.bower['totvs-twebchannel']];

			return removeTask.uninstall(removeList)
				.then((result) => {
					console.log(' - Instaling ' + 'cloudbridge-core-js'.bold);

					return addTask.install(addList);
				});
		}

	}


	get project() {
		if (this.__project == null) {
			this.__project = project.load(this.projectDir);
		}

		return this.__project;
	}

}

module.exports = AppTask;
