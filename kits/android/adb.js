var Q = require('q');
var os = require('os');
//var spawn = require('cordova-common').superspawn.spawn;
var child_process = require('child_process');


/*
	adb.on('close', function(code) {
		if (code > 0) {
			d.reject('Failed to run logcat command.');
		} else d.resolve();
	});
	*/
var Adb = {};

function spawn(command, args, options) {
	var d = Q.defer();
	var child = child_process.spawn(command, args, options);
	var capturedOut = '';
	var capturedErr = '';

	if (child.stdout) {
		child.stdout.on('data', function(data) {
			capturedOut += data;
			d.notify({ 'stdout': data });
		});
	}

	if (child.stderr) {
		child.stderr.on('data', function(data) {
			capturedErr += data;
			d.notify({ 'stderr': data });
		});
	}

	child.on('close', whenDone);
	child.on('error', whenDone);

	function whenDone(arg) {
		child.removeListener('close', whenDone);
		child.removeListener('error', whenDone);

		var code = typeof arg == 'number' ? arg : arg && arg.code;

		if (code === 0) {
			d.resolve(capturedOut.trim());
		}
		else {
			var errMsg = cmd + ': Command failed with exit code ' + code;
			if (capturedErr) {
				errMsg += ' Error output:\n' + capturedErr.trim();
			}
			var err = new Error(errMsg);
			err.code = code;
			d.reject(err);
		}
	}

	return d.promise;
}

function isDevice(line) {
	return line.match(/\w+\tdevice/) && !line.match(/emulator/);
}

function isEmulator(line) {
	return line.match(/device/) && line.match(/emulator/);
}

/**
 * Lists available/connected devices and emulators
 *
 * @param   {Object}   opts			Various options
 * @param   {Boolean}  opts.emulators  Specifies whether this method returns
 *   emulators only
 *
 * @return  {Promise<String[]>}		list of available/connected
 *   devices/emulators
 */
Adb.devices = function(opts) {
	return spawn('adb', ['devices'], { cwd: os.tmpdir() })
		.then(function(output) {
			return output.split('\n').filter(function(line) {
				// Filter out either real devices or emulators, depending on options
				return (line && opts && opts.emulators) ? isEmulator(line) : isDevice(line);
			}).map(function(line) {
				return line.replace(/\tdevice/, '').replace('\r', '');
			});
		});
};

Adb.install = function(target, packagePath, opts) {
	console.log('Installing apk ' + packagePath + ' on target ' + target + '...');

	var args = ['-s', target, 'install'];

	if (opts && opts.replace)
		args.push('-r');

	return spawn('adb', args.concat(packagePath), { cwd: os.tmpdir() })
		.then(function(output) {
			// 'adb install' seems to always returns no error, even if installation fails
			// so we catching output to detect installation failure
			if (output.match(/Failure/)) {
				if (output.match(/INSTALL_PARSE_FAILED_NO_CERTIFICATES/)) {
					output += '\n\n' + 'Sign the build using \'-- --keystore\' or \'--buildConfig\'' +
						' or sign and deploy the unsigned apk manually using Android tools.';
				}
				else if (output.match(/INSTALL_FAILED_VERSION_DOWNGRADE/)) {
					output += '\n\n' + 'You\'re trying to install apk with a lower versionCode that is already installed.' +
						'\nEither uninstall an app or increment the versionCode.';
				}

				return Q.reject(new Error('Failed to install apk to device: ' + output));
			}
		});
};

Adb.uninstall = function(target, packageId) {
	console.log('Uninstalling package ' + packageId + ' from target ' + target + '...');

	return spawn('adb', ['-s', target, 'uninstall', packageId], { cwd: os.tmpdir() });
};

Adb.shell = function(target, shellCommand) {
	console.log('Running adb shell command "' + shellCommand + '" on target ' + target + '...');
	var args = ['-s', target, 'shell'];
	shellCommand = shellCommand.split(/\s+/);
	return spawn('adb', args.concat(shellCommand), { cwd: os.tmpdir() })
		.catch(function(output) {
			return Q.reject(new Error('Failed to execute shell command "' +
				shellCommand + '"" on device: ' + output));
		});
};

Adb.start = function(target, activityName) {
	console.log('Starting application "' + activityName + '" on target ' + target + '...');
	return Adb.shell(target, 'am start -W -a android.intent.action.MAIN -n' + activityName)
		.catch(function(output) {
			return Q.reject(new Error('Failed to start application "' +
				activityName + '"" on device: ' + output));
		});
};

module.exports = Adb;
