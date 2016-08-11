var Task = cb_require('tasks/task').Task,
	path = require('path'),
	shelljs = require('shelljs'),
	Q = require('q'),
	resources = cb_require('utils/resources');

var utils = cli.utils;

var CloudBridgeTask = function() { };
CloudBridgeTask.prototype = new Task();

CloudBridgeTask.prototype.run = function run(cloudbridge, argv) {
	var platforms = [],
		projectData = null;

	if (argv._.indexOf('android') != -1)
		platforms.push('android');

	if (argv._.indexOf('ios') != -1)
		platforms.push('ios');

	if (platforms.length === 0) {
		throw new Error("Invalid platform!");
	}

	var promise = resources.getConfigData(cloudbridge.projectDir).then(function(data) {
		projectData = data;
	});

	// Then execute requirement checks one-by-one
	promise = platforms.reduce(function(promise, platform, index) {
		var repo = 'cloudbridge-kit-' + platform,
			resourceUrl = 'https://github.com/totvstec/' + repo + '/archive/master.zip',
			unzipPath = path.join(cloudbridge.projectDir, 'build', 'download');

		return promise.then(function() {
			//return utils.fetchArchive(unzipPath, resourceUrl);

			var srcDir = path.join('F:', 'node', 'ionic', 'cloudbridge-kit-android-teste', '*'),
				targetDir = path.join(unzipPath, 'cloudbridge-kit-android-master');

			shelljs.rm('-rf', path.join(cloudbridge.projectDir, 'src', 'android'));

			shelljs.mkdir('-p', targetDir);
			shelljs.cp('-Rf', srcDir, targetDir);
		})
		/*
		.then(function() {
			var srcDir = path.join(unzipPath, repo + '-master', 'src'),
				targetDir = path.join(cloudbridge.projectDir, 'src');

			return utils.copyTemplate(srcDir, targetDir, projectData);
		})
		.then(function() {
			var srcDir = path.join(unzipPath, repo + '-master', 'build', '*'),
				targetDir = path.join(cloudbridge.projectDir, 'build');

			shelljs.cp('-Rf', srcDir, targetDir);
		})
		*/
		.then(function() {
			var x = null;

			try {
				x = require(path.join(unzipPath, repo + '-master', 'index'));
			}
			catch (error) {
				console.error(error);
			}

			if (x !== null)
				x.run(cloudbridge, projectData);
		})
		.then(function() {
			console.log('The platform "' + platform + '" has been successfully added to your project!');

			var android = require(__basedir + '/kits/android');

			android.build(cloudbridge);

		})
		.catch(function(ex) {
			console.error(ex);
		});
	}, promise);

	return promise;
};

CloudBridgeTask.prototype.install = function(promise, platforms) {

};

exports.CloudBridgeTask = CloudBridgeTask;
