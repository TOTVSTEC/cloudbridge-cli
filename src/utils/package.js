'use strict';

var utils = cb_require('utils/utils'),
	path = require('path'),
	fs = require('fs'),
	shelljs = require('shelljs'),
	Q = require('q'),
	semver = require('semver'),
	request = require('request');

const CLOUDBRIDGE_HOME = path.join(process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH, '.cloudbridge');

class Package {

	constructor(name, group, version) {
		if (typeof name === 'object') {
			var options = name;

			this.name = options.name;
			this.group = options.group || 'totvstec';
			this.version = options.version || 'master';
		}
		else {
			if (name.indexOf('/') !== -1) {
				let parts = name.split('/');

				group = parts[0];
				name = parts[1];
			}

			this.name = name;
			this.group = group || 'totvstec';
			this.version = version || 'master';
		}

		if (typeof this.version !== 'string')
			this.version = 'master';

		if (Package.data === undefined) {
			Package.loadData();
		}

		this.version = semver.valid(this.version.replace(/[\^~]/g, '')) || 'master';
	}

	latest() {
		var deferred = Q.defer(),
			etag = this.getEtag(),
			url = 'https://api.github.com/repos/' + this.group + '/' + this.name + '/tags',
			_this = this,
			options = {
				url: url,
				json: true,
				headers: {
					'User-Agent': 'https://github.com/TOTVSTEC/cloudbridge-cli'
				}
			};

		if (etag)
			options.headers['If-None-Match'] = etag;

		request.get(options, function(err, res, data) {
			if (err) {
				deferred.reject(err);
				return;
			}

			_this.saveEtag(res.headers.etag);

			if (res.statusCode === 304) {
				_this.version = _this.getVersion();

				deferred.resolve(_this.version);
			}
			else {
				try {
					if (data[0] === undefined) {
						console.error('Error: The request to "' + url + '" returned:');
						console.error(JSON.stringify(data));

						console.log('x-ratelimit-limit:     ' + res.headers['x-ratelimit-limit']);
						console.log('x-ratelimit-remaining: ' + res.headers['x-ratelimit-remaining']);
						console.log('x-ratelimit-reset:     ' + new Date(Number(res.headers['x-ratelimit-reset']) * 1000));
					}

					_this.version = data[0].name.replace(/^[\^~v=\s]+/ig, '');

					_this.saveVersion();

					deferred.resolve(_this.version);
				}
				catch (e) {
					deferred.reject(e);
				}
			}
		});

		return deferred.promise;
	}

	getEtag() {
		var data = Package.data,
			id = this.group + '/' + this.name;

		if (data[id]) {
			return data[id].etag || "";
		}

		return "";
	}

	getVersion() {
		var data = Package.data,
			id = this.group + '/' + this.name;

		if (data[id]) {
			return data[id].version || "master";
		}

		return "master";
	}

	saveEtag(etag) {
		if (typeof etag !== 'string')
			return;

		var id = this.group + '/' + this.name;

		Package.data[id] = Package.data[id] || {};

		if (Package.data[id].etag !== etag) {
			Package.data[id].etag = etag;
			Package.saveData();
		}
	}

	saveVersion() {
		var id = this.group + '/' + this.name;

		Package.data[id] = Package.data[id] || {};

		if (Package.data[id].version !== this.version) {
			Package.data[id].version = this.version;
			Package.saveData();
		}
	}

	static loadData() {
		var file = path.join(CLOUDBRIDGE_HOME, 'packages.json');

		if (fs.existsSync(file)) {
			Package.data = JSON.parse(fs.readFileSync(file));
		}
		else {
			Package.data = {};
		}
	}

	static saveData() {
		var file = path.join(CLOUDBRIDGE_HOME, 'packages.json'),
			dataString = JSON.stringify(Package.data, null, 2);

		fs.writeFileSync(file, dataString);
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


