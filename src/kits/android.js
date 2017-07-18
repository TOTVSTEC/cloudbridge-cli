'use strict';

let Q = require('q'),
	path = require('path'),
	shelljs = require('shelljs'),
	semver = require('semver'),
	spawn = cb_require('utils/spawn'),
	checker = require('./android/checker'),
	adb = require('./android/adb'),
	fs = require('fs');

class Android {

	static get checker() {
		return checker;
	}

	static get adb() {
		return adb;
	}

	static build(gradleDir, projectDir) {
		var args = getGradlewArgs();
		let grad = path.join(gradleDir, args[0]);
		fs.chmodSync(grad, '755');
		args.push('build');
		args.push('--project-dir=' + projectDir);
		args.push('--console=rich');
		args.push('--configure-on-demand');
		args.push('-Dorg.gradle.daemon=true');
		args.push('-Dorg.gradle.jvmargs=-Xmx2048m');

		//cmd += path.join(targetDir, 'gradlew.bat');
		//cmd += ' build';
		//cmd += ' -p' + path.join(projectDir, 'src', 'android');
		//cmd += ' -PbuildDir="' + path.join(projectDir, 'build', 'android', 'build') + '"';
		//cmd += ' --project-cache-dir "' + path.join(projectDir, 'build', 'android', '.gradle') + '"';

		console.log('cwd: ' + gradleDir);
		console.log('cmd: ' + args.join(' '));

		return exec(args, gradleDir);

		/*
		return Android.build_tools()
			.then((values) => {
				console.log(values);
			})
			.then(() => {
				return exec(args, gradleDir);
			});
		*/
	}

	static stopGradleDaemon(targetDir) {
		let args = getGradlewArgs();
		let grad = path.join(targetDir, args[0]);
		fs.chmodSync(grad, '755');
		args.push('--stop');

		return exec(args, targetDir);
	}

	static startGradleDaemon(targetDir) {
		let args = getGradlewArgs();
		let grad = path.join(targetDir, args[0]);
		fs.chmodSync(grad, '755');
		args.push('--daemon');
		args.push('--exclude-task=help');
		args.push('-Dorg.gradle.daemon=true');
		args.push('-Dorg.gradle.jvmargs=-Xmx2048m');

		return exec(args, targetDir);
	}

	static build_tools() {
		let dir = path.join(process.env.ANDROID_HOME, 'build-tools'),
			tags = shelljs.ls(dir);

		let result = Array.from(tags).sort(semver.rcompare);

		return Q(result);
	}

}







function getGradlewArgs() {
	if (process.platform === 'win32') {
		return ['cmd.exe', '/c', 'gradlew.bat'];
	}
	else {
		return ['./gradlew'];
	}
}

function exec(args, targetDir) {
	let cmd = args.splice(0, 1)[0];

	return spawn(cmd, args, {
		cwd: targetDir,
		stdio: ['ignore', 'inherit', 'inherit']
	});
}

module.exports = Android;
