'use strict';

var Q = require('q'),
	AppTaskBase = require('./../app-task-base');

class RunTask extends AppTaskBase {

	run(cloudbridge, argv) {
		console.log('\nThis is the cloudbridge cordova run task!\n');

		return Q();
	}

}

module.exports = RunTask;
