'use strict';

var Q = require('q'),
	Task = require('./../task');

class StartTask extends Task {

	run(cloudbridge, argv) {
		console.log('\nThis is the cloudbridge cordova start task!\n');

		return Q();
	}

}

module.exports = StartTask;
