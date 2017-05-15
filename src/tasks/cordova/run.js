'use strict';

var Q = require('q'),
	Task = require('./../task');

class RunTask extends Task {

	run(cloudbridge, argv) {
		console.log('\nThis is the cloudbridge cordova run task!\n');

		return Q();
	}

}

module.exports = RunTask;
