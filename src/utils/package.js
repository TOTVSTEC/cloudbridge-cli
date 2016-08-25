var utils = cb_require('utils/utils'),
	path = require('path'),
	shelljs = require('shelljs'),
	Q = require('q');

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

Package.prototype.fetch = function fetch() {
	var _this = this,
		homeDir = process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH,
		packageDir = path.join(homeDir, '.cloudbridge', 'packages', this.group, this.name),
		outputDir = path.join(packageDir, this.version),
		url = 'https://github.com/' + this.group + '/' + this.name + '/archive/' + this.version + '.zip';

	_this.src = outputDir;

	if (shelljs.test('-d', outputDir)) {
		return Q.fcall(function() {
			return outputDir;
		});
	}

	shelljs.mkdir('-p', packageDir);

	return utils.fetchArchive(packageDir, url).then(function() {
		var contentDir = path.join(packageDir, _this.name + '-' + _this.version);

		shelljs.mv(contentDir, outputDir);

		return outputDir;
	});
};

Package.prototype.install = function install(targetPath, projectData) {
	return this.execute('install', targetPath, projectData);
};

Package.prototype.execute = function execute(action, targetPath, projectData) {
	var task = null,
		moduleName = path.join(this.src, action);

	try {
		task = require(moduleName);
	}
	catch (error) {
		console.error(error);
	}

	if (task !== null) {
		return task.run(cli, targetPath, projectData);
	}
};

module.exports = Package;

