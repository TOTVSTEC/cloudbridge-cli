'use strict';

let path = require('path'),
	semver = require('semver'),
	BuildTask = require('./build'),
	pathUtils = cb_require('utils/paths'),
	fileUtils = cb_require('utils/file'),
	shelljs = require('shelljs'),
	android = cb_require('kits/android'),
	checker = android.checker,
	AdvplCompileTask = require('./advpl-compile');

let ANDROID_KEY = pathUtils.get('ANDROID_SRC'),
	RPO_KEY = pathUtils.get('RPO_SRC'),
	WEB_KEY = pathUtils.get('WEB_SRC'),
	BOWER_KEY = path.join('build', 'bower'),
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
		let forceClean = this.needClean(argv),
			task = new AdvplCompileTask(this.options),
			promise = task.run(cloudbridge, argv);

		return promise
			.then(() => {
				return checker.check_java();
			})
			.then((javaVersion) => {
				var androidKitVersion = semver.coerce((this.project.get('platform') || {}).android),
					oldKit = semver.lt(androidKitVersion, '0.2.0'),
					java10 = semver.gte(javaVersion, '10.0.0');

				if ((oldKit) && (java10)) {
					console.log('');
					console.log('The cloudbridge platform android v' + androidKitVersion + ' is not compatible with java ' + javaVersion);
					console.log('Please run ' + (('cloudbrige update').bold) + ' to update the android platform');
					console.log('');

					throw new Error('Incompatible java and android kit versions.\n');
				}

				return checker.check_android();
			})
			.then(() => {
				if (forceClean)
					return this.clean();
			})
			.then(() => {
				return this.prepare();
			})
			.then(() => {
				return this.assemble();
			})
			.then((modified) => {
				if (!modified)
					return;

				return this.build()
					.then(() => {
						return this.finish();
					});
			})
			.catch((err) => {
				console.error(err.message);
			});
	}

	needClean(argv) {
		if (argv.clean || argv.c)
			return true;

		if (fileUtils.platformChanged(this.projectDir, 'android'))
			return true;

		return false;
	}

	clean() {
		var androidKitDir = path.join(this.projectDir, 'build', 'android'),
			stagingDir = path.join(androidKitDir, 'staging'),
			apks = path.join(this.projectDir, 'build', '*.apk');

		return android.stopGradleDaemon(androidKitDir)
			.then(() => {
				shelljs.rm('-rf', apks);
				shelljs.rm('-rf', stagingDir);

				fileUtils.saveModifiedTime(this.projectDir, ANDROID_KEY, {});
				fileUtils.saveModifiedTime(this.projectDir, WEB_KEY, {});
				fileUtils.saveModifiedTime(this.projectDir, RPO_KEY, {});
				fileUtils.saveModifiedTime(this.projectDir, BOWER_KEY, {});
			});
	}

	prepare() {
		let androidBuild = path.join(this.projectDir, 'build', 'android'),
			stagingDir = path.join(androidBuild, 'staging'),
			webDir = path.join(stagingDir, 'assets', 'web');

		if (!shelljs.test('-d', stagingDir)) {
			shelljs.mkdir('-p', stagingDir);
			shelljs.mkdir('-p', webDir);
			shelljs.mkdir('-p', path.join(webDir, 'bower'));

			//shelljs.cp('-Rf', path.join(androidBuild, 'gradlew'), stagingDir);
			//shelljs.cp('-Rf', path.join(androidBuild, 'gradlew.bat'), stagingDir);
			//shelljs.cp('-Rf', path.join(androidBuild, 'gradle'), stagingDir);
			shelljs.cp('-Rf', path.join(androidBuild, 'assets'), stagingDir);
			shelljs.cp('-Rf', path.join(androidBuild, 'libs'), stagingDir);

			fileUtils.savePlatformVersion(this.projectDir, 'android');
		}
	}

	assemble() {
		var androidBuild = path.join(this.projectDir, 'build', 'android'),
			bowerDir = path.join(this.projectDir, 'build', 'bower'),
			stagingDir = path.join(androidBuild, 'staging'),
			assetsDir = path.join(stagingDir, 'assets'),
			webDir = path.join(assetsDir, 'web'),
			modified = false;

		modified |= this.copyModifiedFiles(ANDROID_SRC, stagingDir, ANDROID_KEY);
		modified |= this.copyModifiedFiles(WEB_SRC, webDir, WEB_KEY);
		modified |= this.copyModifiedFiles(RPO_SRC, assetsDir, RPO_KEY);

		//TODO: verificar bower
		modified |= this.copyModifiedDirs(bowerDir, path.join(webDir, 'bower'), BOWER_KEY);

		return modified;
	}

	copyModifiedDirs(from, to, key) {
		return this.copyModified(from, to, key, {
			file: false,
			dir: true,
			recurse: false
		});
	}

	copyModifiedFiles(from, to, key) {
		return this.copyModified(from, to, key);
	}

	copyModified(from, to, key, options) {
		let currentFiles = fileUtils.readModifiedTime(from, options),
			previousFiles = fileUtils.loadModifiedTime(this.projectDir, key),
			result = fileUtils.diff(previousFiles, currentFiles),
			copyFiles = result.modified.concat(result.added),
			removeFiles = result.removed;

		if ((copyFiles.length + removeFiles.length) === 0) {
			return false;
		}

		copyFiles.forEach((file, index, array) => {
			let origin = path.join(from, file),
				target = path.join(to, file);

			shelljs.mkdir('-p', path.dirname(target));
			shelljs.cp('-Rf', origin, target);
		});

		removeFiles.forEach((file, index, array) => {
			shelljs.rm('-rf', path.join(to, file));
		});

		fileUtils.saveModifiedTime(this.projectDir, key, currentFiles);

		return true;
	}

	build() {
		var androidKitDir = path.join(this.projectDir, 'build', 'android'),
			stagingDir = path.join(androidKitDir, 'staging');

		if (!process.env._JAVA_OPTIONS) {
			process.env['_JAVA_OPTIONS'] = '-Xmx512m';
		}

		return android.build(androidKitDir, stagingDir);
	}

	finish() {
		var project = this.project.data(),
			buildDir = path.join(this.projectDir, 'build'),
			apkDir = path.join(buildDir, 'android', 'staging', 'build', 'outputs', 'apk'),
			files = shelljs.ls('-R', apkDir);

		files.forEach((file) => {
			if (path.extname(file).toLowerCase() === '.apk') {
				var newName = path.basename(file.replace(/staging/igm, project.name)),
					targetFile = path.join(buildDir, newName);

				shelljs.mv(path.join(apkDir, file), targetFile);
			}
		});
	}

}

module.exports = BuildAndroidTask;
