'use strict';

var BuildTask = cb_require('tasks/build'),
	path = require('path'),
	os = require('os'),
	shelljs = require('shelljs'),
	android = require(__basedir + '/kits/android'),
	Q = require('q');

var BuildAndroidTask = function() { };
BuildAndroidTask.prototype = new BuildTask();

BuildAndroidTask.prototype.run = function run(cloudbridge, argv) {
	var _this = this,
		promise;

	switch (os.type()) {
		case 'Windows_NT':
			var BuildWindowsTask = require('./build-windows'),
			task = new BuildWindowsTask();

			promise = task.run(cloudbridge, argv);
			break;
		case 'Linux':
			promise = Q();
			//TODO: compile on linux
			break;
		case 'Darwin':
			promise = Q();
			//TODO: compile on osx

			break;
	}

	return promise
		.then(function() {
			return _this.clean();
		})
		.then(function() {
			return _this.assemble();
		})
		.then(function() {
			return _this.build();
		})
		.then(function() {
			return _this.finish();
		});
};

BuildAndroidTask.prototype.clean = function clean() {
	var stagingDir = path.join(this.projectDir, 'build', 'android', 'staging'),
		webDir = path.join(stagingDir, 'assets', 'web'),
		apks = path.join(this.projectDir, 'build', '*.apk');

	shelljs.rm('-rf', apks);
	shelljs.rm('-rf', stagingDir);
	shelljs.mkdir('-p', webDir);
};

BuildAndroidTask.prototype.assemble = function assemble() {
	var androidSrc = path.join(this.projectDir, 'src', 'android'),
		rpoSrc = path.join(this.projectDir, 'src', 'apo', '*.rpo'),
		webSrc = path.join(this.projectDir, 'src', 'web'),
		androidBuild = path.join(this.projectDir, 'build', 'android'),
		bowerDir = path.join(this.projectDir, 'build', 'bower'),
		stagingDir = path.join(androidBuild, 'staging'),
		assetsDir = path.join(stagingDir, 'assets');


	shelljs.cp('-Rf', path.join(androidSrc, '*'), stagingDir);
	shelljs.cp('-Rf', path.join(androidBuild, 'gradlew'), stagingDir);
	shelljs.cp('-Rf', path.join(androidBuild, 'gradlew.bat'), stagingDir);
	shelljs.cp('-Rf', path.join(androidBuild, 'gradle'), stagingDir);
	shelljs.cp('-Rf', path.join(androidBuild, 'assets'), stagingDir);
	shelljs.cp('-Rf', path.join(androidBuild, 'libs'), stagingDir);

	shelljs.cp('-Rf', rpoSrc, assetsDir);
	shelljs.cp('-Rf', webSrc, assetsDir);

	shelljs.cp('-Rf', bowerDir, path.join(assetsDir, 'web'));
};

BuildAndroidTask.prototype.build = function build() {
	var stagingDir = path.join(this.projectDir, 'build', 'android', 'staging');

	return android.build(stagingDir);
};

BuildAndroidTask.prototype.finish = function finish() {
	var project = this.project.data(),
		buildDir = path.join(this.projectDir, 'build'),
		apkDir = path.join(buildDir, 'android', 'staging', 'build', 'outputs', 'apk'),
		files = shelljs.ls(path.join(apkDir, '*.apk'));

	for (var i = 0; i < files.length; i++) {
		var newName = path.basename(files[i].replace(/staging/igm, project.name)),
			targetFile = path.join(buildDir, newName);

		shelljs.mv(files[i], targetFile);
	}
};

module.exports = BuildAndroidTask;
