'use strict';

const semver = require('semver');

class SemVer {

	static removeModifier(version) {
		if (typeof version !== 'string')
			return null;

		return version.replace(/^[\^~v= ]+/ig, '');
	}

	static modifier(range) {
		if (typeof range === 'string') {
			var modifier = range.trim();

			if (modifier.length > 0) {
				if ((modifier[0] === '^') || (modifier[0] === '~'))
					return modifier[0];
			}
		}

		return '';
	}

	static get semver() {
		return semver;
	}

}

module.exports = SemVer;


