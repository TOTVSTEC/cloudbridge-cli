'use strict';

var utils = cb_require('utils/utils'),
	path = require('path'),
	shelljs = require('shelljs'),
	Q = require('q'),
	semver = require('semver'),
	request = require('request');

var Package = function(name, group, version) {
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
};

Package.prototype.latest = function latest() {
	var deferred = Q.defer(),
		url = 'http://registry.npmjs.org/' + this.name + '/latest',
		_this = this;

	request.get(url, function(err, res, body) {
		if (err) {
			deferred.reject(err);
		}

		try {
			_this.version = JSON.parse(body).version;

			deferred.resolve(_this.version);
		}
		catch (e) {
			deferred.reject(e);
		}
	});

	return deferred.promise;
};

Package.prototype.fetch = function fetch() {
	var _this = this,
		homeDir = process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH,
		packageDir = path.join(homeDir, '.cloudbridge', 'packages', this.group, this.name),
		outputDir = path.join(packageDir, this.version),
		url = 'https://github.com/' + this.group + '/' + this.name + '/archive/';

	if (semver.valid(this.version)) {
		url += 'v';
	}

	url += this.version + '.zip';

	_this.src = outputDir;

	if (shelljs.test('-d', outputDir)) {
		return Q.fcall(function() {
			return outputDir;
		});
	}

	shelljs.mkdir('-p', packageDir);

	return utils.fetchArchive(packageDir, url, true)
		.then(function() {
			var contentDir = path.join(packageDir, _this.name + '-' + _this.version);

			shelljs.mv(contentDir, outputDir);

			return outputDir;
		});
};

Package.prototype.install = function install(targetPath, projectData) {
	return this.execute('install', targetPath, projectData);
};

Package.prototype.restore = function restore(targetPath, projectData) {
	return this.execute('restore', targetPath, projectData);
};

Package.prototype.update = function update(targetPath, projectData) {
	return this.execute('update', targetPath, projectData);
};

Package.prototype.remove = function remove(targetPath, projectData) {
	return this.execute('remove', targetPath, projectData);
};

Package.prototype.execute = function execute(action, targetPath, projectData) {
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
};

module.exports = Package;


