'use strict';

var Q = require('q'),
	Task = require('./../task');

class BuildTask extends Task {

	run(cloudbridge, argv) {
		console.log('\nThis is the cloudbridge cordova build task!\n');

		return Q();
	}

}

module.exports = BuildTask;
