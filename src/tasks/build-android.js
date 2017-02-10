'use strict';

var BuildTask = cb_require('tasks/build'),
	path = require('path'),
	pathUtils = cb_require('utils/paths'),
	fileUtils = cb_require('utils/file'),
	shelljs = require('shelljs'),
	android = cb_require('kits/android'),
	Q = require('q');

let ANDROID_KEY = pathUtils.get('ANDROID_SRC'),
	RPO_KEY = pathUtils.get('RPO_SRC'),
	WEB_KEY = pathUtils.get('WEB_SRC'),
	ANDROID_SRC,
	RPO_SRC,
	WEB_SRC;


class BuildAndroidTask extends BuildTask {

	constructor(options) {
		super(options);

		ANDROID_SRC = path.join(this.projectDir, ANDROID_KEY);
		RPO_SRC = path.join(this.projectDir, RPO_KEY);
		WEB_SRC = path.join(this.projectDir, WEB_KEY);
	}

	run(cloudbridge, argv) {
		var promise;

		switch (process.platform) {
			case 'win32':
				var BuildWindowsTask = require('./build-windows'),
					task = new BuildWindowsTask();

				promise = task.run(cloudbridge, argv);
				break;
			case 'linux':
				promise = Q();
				//TODO: compile on linux
				break;
			case 'darwin':
				promise = Q();
				//TODO: compile on osx

				break;
		}

		return promise
			.then(() => {
				if (argv.clean || argv.c)
					return this.clean();
			})
			.then(() => {
				return this.prepare();
			})
			.then(() => {
				return this.assemble();
			})
			.then(() => {
				return this.build();
			})
			.then(() => {
				return this.finish();
			});
	}

	clean() {
		var stagingDir = path.join(this.projectDir, 'build', 'android', 'staging'),
			apks = path.join(this.projectDir, 'build', '*.apk');

		shelljs.rm('-rf', apks);
		shelljs.rm('-rf', stagingDir);

		fileUtils.saveModifiedTime(this.projectDir, ANDROID_KEY, {});
		fileUtils.saveModifiedTime(this.projectDir, WEB_KEY, {});
		fileUtils.saveModifiedTime(this.projectDir, RPO_KEY, {});
	}

	prepare() {
		var androidBuild = path.join(this.projectDir, 'build', 'android'),
			stagingDir = path.join(androidBuild, 'staging'),
			webDir = path.join(stagingDir, 'assets', 'web');

		if (!shelljs.test('-d', stagingDir)) {
			shelljs.mkdir('-p', stagingDir);
			shelljs.mkdir('-p', webDir);

			shelljs.cp('-Rf', path.join(androidBuild, 'gradlew'), stagingDir);
			shelljs.cp('-Rf', path.join(androidBuild, 'gradlew.bat'), stagingDir);
			shelljs.cp('-Rf', path.join(androidBuild, 'gradle'), stagingDir);
			shelljs.cp('-Rf', path.join(androidBuild, 'assets'), stagingDir);
			shelljs.cp('-Rf', path.join(androidBuild, 'libs'), stagingDir);
		}
	}

	assemble() {
		var androidBuild = path.join(this.projectDir, 'build', 'android'),
			bowerDir = path.join(this.projectDir, 'build', 'bower'),
			stagingDir = path.join(androidBuild, 'staging'),
			assetsDir = path.join(stagingDir, 'assets'),
			webDir = path.join(assetsDir, 'web');

		this.copyModifiedFiles(ANDROID_SRC, stagingDir, ANDROID_KEY);
		this.copyModifiedFiles(WEB_SRC, webDir, WEB_KEY);
		this.copyModifiedFiles(RPO_SRC, assetsDir, RPO_KEY);

		//shelljs.cp('-Rf', path.join(ANDROID_SRC, '*'), stagingDir);
		//shelljs.cp('-Rf', path.join(RPO_SRC, '*.rpo'), assetsDir);
		//shelljs.cp('-Rf', WEB_SRC, assetsDir);

		//TODO: verificar bower
		shelljs.cp('-Rf', bowerDir, webDir);
	}


	copyModifiedFiles(from, to, key) {
		let currentFiles = fileUtils.readModifiedTime(from),
			previousFiles = fileUtils.loadModifiedTime(this.projectDir, key),
			result = fileUtils.diff(previousFiles, currentFiles),
			copyFiles = result.modified.concat(result.added),
			removeFiles = result.removed;

		//console.log('\n - modified files');
		copyFiles.forEach((file, index, array) => {
			let origin = path.join(from, file),
				target = path.join(to, file);

			shelljs.mkdir('-p', path.dirname(target));
			shelljs.cp('-Rf', origin, target);

			console.log('coping ' + origin + ' to ' + target);
		});

		//console.log('\n - deleted files');
		removeFiles.forEach((file, index, array) => {
			shelljs.rm('-rf', path.join(to, file));

			console.log('deleting ' + path.join(to, file));
		});


		fileUtils.saveModifiedTime(this.projectDir, key, currentFiles);
	}

	/*
		copyModifiedFiles(from, to, key) {
			let currentFiles = fileUtils.readModifiedTime(ANDROID_SRC),
				previousFiles = fileUtils.loadModifiedTime(this.projectDir, ANDROID_KEY),
				result = fileUtils.diff(previousFiles, currentFiles),
				copyFiles = result.modified.concat(result.added),
				removeFiles = result.removed;

			var androidBuild = path.join(this.projectDir, 'build', 'android'),
				stagingDir = path.join(androidBuild, 'staging'),
				assetsDir = path.join(stagingDir, 'assets');

			//console.log('\n - modified files');
			copyFiles.forEach((file, index, array) => {
				shelljs.cp('-Rf', path.join(ANDROID_SRC, file), path.join(stagingDir, file));
			});

			//console.log('\n - deleted files');
			removeFiles.forEach((file, index, array) => {
				shelljs.rm('-rf', path.join(stagingDir, file));

				//console.log(value);
			});


			fileUtils.saveModifiedTime(this.projectDir, ANDROID_KEY, currentFiles);
		}
	*/
	build() {
		var stagingDir = path.join(this.projectDir, 'build', 'android', 'staging');

		return android.build(stagingDir);
	}

	finish() {
		var project = this.project.data(),
			buildDir = path.join(this.projectDir, 'build'),
			apkDir = path.join(buildDir, 'android', 'staging', 'build', 'outputs', 'apk'),
			files = shelljs.ls(path.join(apkDir, '*.apk'));

		for (var i = 0; i < files.length; i++) {
			var newName = path.basename(files[i].replace(/staging/igm, project.name)),
				targetFile = path.join(buildDir, newName);

			shelljs.mv(files[i], targetFile);
		}
	}

}

module.exports = BuildAndroidTask;
