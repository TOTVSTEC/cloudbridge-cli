'use strict';

var Q = require('q'),
	AppTaskBase = require('./../app-task-base');

class BuildTask extends AppTaskBase {

	run(cloudbridge, argv) {
		console.log('\nThis is the cloudbridge cordova build task!\n');

		return Q();
	}

}

module.exports = BuildTask;
