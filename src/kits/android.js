'use strict';

var android = module.exports,
	spawn = cb_require('utils/spawn');

android.checker = require('./android/checker');
android.adb = require('./android/adb');

android.build = function(gradleDir, projectDir) {
	var	args = getGradlewArgs();

	args.push('build');
	args.push('--project-dir=' + projectDir);
	args.push('--console=rich');
	args.push('-Dorg.gradle.daemon=true');
	args.push('-Dorg.gradle.jvmargs=-Xmx2048m');

	//cmd += path.join(targetDir, 'gradlew.bat');
	//cmd += ' build';
	//cmd += ' -p' + path.join(cli.projectDir, 'src', 'android');
	//cmd += ' -PbuildDir="' + path.join(cli.projectDir, 'build', 'android', 'build') + '"';
	//cmd += ' --project-cache-dir "' + path.join(cli.projectDir, 'build', 'android', '.gradle') + '"';

	console.log('cwd: ' + gradleDir);
	console.log('cmd: ' + args.join(' '));

	return exec(args, gradleDir);
};

android.stopGradleDaemon = function(targetDir) {
	let args = getGradlewArgs();

	args.push('--stop');

	return exec(args, targetDir);
};

android.startGradleDaemon = function(targetDir) {
	let args = getGradlewArgs();

	args.push('--daemon');
	args.push('--exclude-task=help');
	args.push('-Dorg.gradle.daemon=true');
	args.push('-Dorg.gradle.jvmargs=-Xmx2048m');

	return exec(args, targetDir);
};


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
