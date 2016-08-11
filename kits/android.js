var android = module.exports,
	child_process = require('child_process'),
	path = require('path'),
	Q = require('q');

android.checker = require('./android/checker');
android.adb = require('./android/adb');
android.build = function(cli) {
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

/*
gradle build command line:
<project_dir>\build\android\gradlew build -p<project_dir>\src\android -PbuildDir="<project_dir>/build/android/build" --project-cache-dir "<project_dir>\build\android\.gradle"


	var android = require(__basedir + '/kits/android');

	android.adb.devices().then(function(data) {
		console.log(data);
	});


	return android.checker.run().then(function() {
		return android.checker.check_gradle();
	//}).then(function() {
	//	return check_reqs.check_ant();
	});


*/
