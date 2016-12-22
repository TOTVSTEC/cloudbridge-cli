'use strict';

var android = module.exports,
	spawn = require('child_process').spawn,
	path = require('path'),
	os = require('os'),
	Q = require('q');

android.checker = require('./android/checker');
android.adb = require('./android/adb');

android.build = function(targetDir) {
	var deferred = Q.defer(),
		cmd = '',
		args = null;

	if (os.type() === 'Windows_NT') {
		cmd = 'cmd.exe';
		args = ['/c', 'gradlew.bat', 'build'];
	}
	else {
		cmd = 'gradlew';
		args = ['build'];
	}

	//cmd += path.join(targetDir, 'gradlew.bat');
	//cmd += ' build';
	//cmd += ' -p' + path.join(cli.projectDir, 'src', 'android');
	//cmd += ' -PbuildDir="' + path.join(cli.projectDir, 'build', 'android', 'build') + '"';
	//cmd += ' --project-cache-dir "' + path.join(cli.projectDir, 'build', 'android', '.gradle') + '"';

	console.log('cwd: ' + targetDir);
	console.log('cmd: ' + cmd + ' ' + args.join(' '));

	var proc = spawn(cmd, args, {
		cwd: targetDir,
		stdio: ['ignore', 'pipe', 'pipe']
	});

	proc.stdout.on('data', function(data) {
		var out = data.toString('ascii');

		if (out.trim()) {
			console.log(out);
		}
	});

	proc.stderr.on('data', function(data) {
		var err = data.toString('ascii');

		if (err.trim()) {
			console.error(err);
		}
	});

	proc.on('close', function(code) {
		if (code !== 0) {
			deferred.reject(new Error("AppServer process exited with code " + code));
		}
		else {
			deferred.resolve();
		}
	});

	proc.on('exit', function(code) {
		if (code !== 0) {
			deferred.reject(new Error("AppServer process exited with code " + code));
		}
		else {
			deferred.resolve();
		}
	});

	proc.on('error', function(err) {
		deferred.reject(err);
	});

	return deferred.promise;
};


/*
android.build0 = function(cli) {
	var d = Q.defer(),
		cmd = '',
		options = {
			cwd: cli.projectDir
		};

	cmd += path.join(cli.projectDir, 'build', 'android', 'gradlew') + ' build';
	cmd += ' -p' + path.join(cli.projectDir, 'src', 'android');
	cmd += ' -PbuildDir="' + path.join(cli.projectDir, 'build', 'android', 'build') + '"';
	cmd += ' --project-cache-dir "' + path.join(cli.projectDir, 'build', 'android', '.gradle') + '"';

	console.log('cwd: ' + cli.projectDir);
	console.log('cmd: ' + cmd);

	child_process.exec(cmd, options, function(err, stdout, stderr) {
		if (err) {
			console.error(err);
			d.reject(new Error(err));
		}
		else {
			console.log(stdout);
			d.resolve(stdout.trim());
		}
	});

	return d.promise;
};
*/


/*
gradle build command line:
<project_dir>\build\android\gradlew build -p<project_dir>\src\android -PbuildDir="<project_dir>/build/android/build" --project-cache-dir "<project_dir>\build\android\.gradle"


	var android = cb_require('kits/android');

	android.adb.devices().then(function(data) {
		console.log(data);
	});


	return android.checker.run().then(function() {
		return android.checker.check_gradle();
	//}).then(function() {
	//	return check_reqs.check_ant();
	});


*/
