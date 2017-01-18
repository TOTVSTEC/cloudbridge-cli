'use strict';

var Task = cb_require('tasks/task'),
	project = cb_require('project/project'),
	path = require('path');


class AppTask extends Task {

	constructor(options) {
		super(options);

		options = options || {};

		this.projectDir = options.target || process.cwd();
		this.silent = options.silent || false;

		this.__project = null;

		this.fixProject();
	}

	fixProject() {
		var project = this.project.data(),
			components = project.components || {};

		if ((project.bowerComponents === undefined) && (Object.keys(components).length > 0)) {
			return;
		}

		components.bower = Object.assign({}, project.bowerComponents || {}, components.bower || {});
		components.advpl = components.advpl || {};

		//if (project.bowerComponents) {
		this.project.remove('bowerComponents');
		//}

		if (!components.advpl['cloudbridge-core-advpl']) {
			if (components.bower['totvs-twebchannel'])
				components.advpl['cloudbridge-core-advpl'] = components.bower['totvs-twebchannel'];
			else
				components.advpl['cloudbridge-core-advpl'] = '0.0.0';
		}

		this.project.set('components', components);
		this.project.save();
	}

	get project() {
		if (this.__project == null) {
			this.__project = project.load(this.projectDir);
		}

		return this.__project;
	}

}

module.exports = AppTask;
