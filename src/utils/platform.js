'use strict';

class Platform {

	static get all() {
		return Platform.desktop.concat(Platform.mobile);
	}

	static get mobile() {
		return ['android', 'ios'];
	}

	static get desktop() {
		return ['windows', 'linux', 'osx'];
	}

	static get default() {
		if (process.platform == 'win32') {
			return 'windows';
		}
		else if (process.platform == 'darwin') {
			return 'osx';
		}

		return process.platform;
	}

	static valid(platform) {
		let target = platform.toLowerCase();

		if (Platform.all.indexOf(target) !== -1) {
			return target;
		}

		return null;
	}

}

module.exports = Platform;
