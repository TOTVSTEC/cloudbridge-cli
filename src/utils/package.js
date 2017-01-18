'use strict';

var utils = cb_require('utils/utils'),
	path = require('path'),
	shelljs = require('shelljs'),
	Q = require('q'),
	semver = require('semver'),
	request = require('request');

class Package {

	constructor(name, group, version) {
		if (typeof name === 'object') {
			var options = name;

			this.name = options.name;
			this.group = options.group || 'totvstec';
			this.version = options.version || 'master';
		}
		else {
			this.name = name;
			this.group = group || 'totvstec';
			this.version = version || 'master';
		}

		if (typeof this.version !== 'string')
			this.version = 'master';

		this.version = semver.valid(this.version.replace(/[\^~]/g, '')) || 'master';
	}

	latest() {
		var deferred = Q.defer(),
			//url = 'http://registry.npmjs.org/' + this.name + '/latest',
			url = 'https://api.github.com/repos/' + this.group + '/' + this.name + '/tags',
			_this = this,
			options = {
				url: url,
				json: true,
				headers: {
					'User-Agent': 'https://github.com/TOTVSTEC/cloudbridge-cli'
				}
			};

		//

		request.get(options, function(err, res, data) {
			if (err) {
				deferred.reject(err);
			}

			try {
				_this.version = data[0].name.replace(/^[\^~v=\s]+/ig, '');

				deferred.resolve(_this.version);
			}
			catch (e) {
				deferred.reject(e);
			}
		});

		return deferred.promise;
	}

	fetch() {
		var _this = this,
			homeDir = process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH,
			packageDir = path.join(homeDir, '.cloudbridge', 'packages', this.group, this.name),
			url = 'https://github.com/' + this.group + '/' + this.name + '/archive/';

		this.version = this.version.replace(/[\^~]/g, '');

		var outputDir = path.join(packageDir, this.version);

		if (semver.valid(this.version)) {
			url += 'v';
		}
		else {
			this.version = 'master';
		}

		url += this.version + '.zip';

		_this.src = outputDir;

		if (shelljs.test('-d', outputDir)) {
			return Q.fcall(function() {
				return outputDir;
			});
		}

		shelljs.mkdir('-p', packageDir);

		return utils.fetchArchive(packageDir, url, false)
			.then(function() {
				var contentDir = path.join(packageDir, _this.name + '-' + _this.version);

				shelljs.mv(contentDir, outputDir);

				return outputDir;
			});
	}

	install(targetPath, projectData) {
		return this.execute('install', targetPath, projectData);
	}

	restore(targetPath, projectData) {
		return this.execute('restore', targetPath, projectData);
	}

	update(targetPath, projectData) {
		return this.execute('update', targetPath, projectData);
	}

	remove(targetPath, projectData) {
		return this.execute('remove', targetPath, projectData);
	}

	execute(action, targetPath, projectData) {
		var task = null,
			moduleName = path.join(this.src, action);

		try {
			task = require(moduleName);
		}
		catch (error) {
			return Q.reject(error);
		}

		if (task !== null) {
			if (task instanceof Function) {
				task = new task(cli, targetPath, projectData);

				return task.run();
			}
			else {
				return task.run(cli, targetPath, projectData);
			}
		}
	}

}

module.exports = Package;


