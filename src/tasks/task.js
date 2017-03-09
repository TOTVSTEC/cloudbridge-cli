'use strict';

let Q = require('q');

class Task {

	constructor(options) {
		this.options = options || {};

		this.projectDir = this.options.target || process.cwd();
	}

	run() {

	}

	prepare() {
		return Q();
	}

}

module.exports = Task;
