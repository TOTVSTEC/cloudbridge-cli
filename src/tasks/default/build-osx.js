'use strict';

let AppTask = require('./app-task'),
	AdvplCompileTask = require('./advpl-compile');

class BuildOSxTask extends AppTask {

	constructor(options) {
		super(options);

		this.advplTask = new AdvplCompileTask(options);
	}

	run(cloudbridge, argv) {
		return this.advplTask.run(cloudbridge, argv);
	}

}

module.exports = BuildOSxTask;
