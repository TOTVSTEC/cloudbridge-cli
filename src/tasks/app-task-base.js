'use strict';

let TaskBase = require('./task-base'),
	project = cb_require('project/project');

class AppTask extends TaskBase {

	constructor(options) {
		super(options);

		this.options = options || {};

		this.projectDir = this.options.target || process.cwd();

		this.__project = null;
	}

	get project() {
		if (this.__project == null) {
			this.__project = project.load(this.projectDir);
		}

		return this.__project;
	}

}

module.exports = AppTask;
