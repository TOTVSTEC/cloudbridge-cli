'use strict';

const semver = require('semver');

var semverClean = semver.clean,
	semverGt = semver.gt;


semver.clean = function(version) {
	if (typeof version !== 'string')
		return null;

	return semverClean(version.trim().replace(/^[\^~v=\s]+/ig, ''));
};

semver.gt = function(v1, v2, loose) {
	return semverGt(this.clean(v1), this.clean(v2), loose);
};

/*
class SemVer {

	static clean(version) {
		if (typeof version !== 'string')
			return null;

		return version.trim().replace(/^[\^~v=]+/ig, '');
	}

	static gt(v1, v2, loose) {
		return semver.gt(SemVer.clean(v1), SemVer.clean(v2), loose);
	}

	static satisfies(version, range, loose) {
		return semver.satisfies(SemVer.clean(version), range, loose);
	}

	static get semver() {
		return semver;
	}

}
*/

module.exports = semver;

