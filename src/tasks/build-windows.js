'use strict';

let AppTask = cb_require('tasks/app-task'),
	AdvplCompileTask = cb_require('tasks/advpl-compile');

class BuildWindowsTask extends AppTask {

	constructor(options) {
		super(options);

		this.advplTask = new AdvplCompileTask(options);
	}

	run(cloudbridge, argv) {
		return this.advplTask.run(cloudbridge, argv);
	}

}

module.exports = BuildWindowsTask;
