'use strict';

let _ = require('underscore'),
	shelljs = require('shelljs'),
	spawn = cb_require('utils/spawn');

class Runner {

	static init(value) {
		this._name = value;
	}

	static parseAguments(_args) {
		var args = _.flatten(Array.prototype.slice.call(_args, 0), true),
			options = {};

		if (args.length > 0) {
			var last = args.pop();

			if (_.isObject(last)) {
				options = last;
			}
			else {
				args.push(last);
			}
		}

		return { args, options };
	}

	static spawn(args, options) {
		if (!options.stdio) {
			options.stdio = 'inherit';
		}

		return spawn(this.command, args, options);
	}

	static get command() {
		if (this._cmd === null) {
			this._cmd = shelljs.which(this._name).stdout.trim();
		}

		return this._cmd;
	}

	static get version() {
		if (this._version === null) {
			this._version = shelljs.exec(this._name + ' --version', { silent: true }).stdout.trim();
		}

		return this._version;
	}

}

Runner._version = null;
Runner._cmd = null;
Runner._name = null;


module.exports = Runner;
