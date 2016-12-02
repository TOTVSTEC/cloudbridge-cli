'use strict';

var Task = cb_require('tasks/task'),
	project = cb_require('project/project'),
	path = require('path');


class AppTask extends Task {

	constructor() {
		super();

		this.projectDir = process.cwd();
		this.__project = null;
	}

	get project() {
		if (this.__project == null) {
			this.__project = project.load(this.projectDir);
		}

		return this.__project;
	}

}

/*
var AppTask = function() {
	this.projectDir = process.cwd();
};

AppTask.prototype = new Task();

AppTask.__project = null;

AppTask.prototype.__defineGetter__('project', function() {
	//return require(path.join(this.projectDir, 'cloudbridge.json'));

	if (AppTask.__project == null) {
		AppTask.__project = project.load(this.projectDir);
	}

	return AppTask.__project;
});
*/

module.exports = AppTask;
