'use strict';

let Runner = cb_require('utils/runner');

class Npm extends Runner {

	static install() {
		var { args, options } = this.parseAguments(arguments);

		return this.spawn(['install'].concat(args), options);
	}

}

Npm.init('npm');

module.exports = Npm;
