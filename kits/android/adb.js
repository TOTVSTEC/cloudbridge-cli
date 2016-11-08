'use strict';

var Q = require('q'),
	os = require('os'),
	spawn = cb_require('utils/spawn');

//var Adb = {};


function isDevice(line) {
	return line.match(/\w+\tdevice/) && !line.match(/emulator/);
}

function isEmulator(line) {
	return line.match(/device/) && line.match(/emulator/);
}

class Adb {

	static devices(opts) {
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

	static install(target, packagePath, opts) {
		console.log('Installing apk ' + packagePath + ' on target ' + target + '...\n');

		var args = ['-s', target, 'install'];

		if (opts && opts.replace)
			args.push('-r');

		return Adb.build_version(target)
			.then(function(output) {
				output = Number(output);

				//Beginning in Android 6.0 (API level 23), users grant permissions to apps
				//while the app is running, not when they install the app.
				//The -g arg grants the  permissions automaticaly.
				if (output >= 23)
					args.push('-g');

				let defered = Q.defer(),
					promise = spawn('adb', args.concat(packagePath), { cwd: os.tmpdir() });

				promise.progress(function(data) {
					if (data.stdout) {
						let message = data.stdout.toString('utf8');
						message = message.replace(/(\[\s+\d+%\].*?\.apk)(?:\r?\n)/igm, '$1\r');

						process.stdout.write(message);
					}

					if (data.stderr) {
						console.error(data.stderr.toString('utf8'));
					}
				}).then(function(output) {
					defered.resolve(output);
				}).catch(function(error) {
					if (error.code === 3221226356) {
						//adb install returns this code (heap corruption)
						//sometimes...
						defered.resolve(error.stdout);
					}
					else {
						defered.reject(error);
					}
				});

				return defered.promise;
			})
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
	}

	static build_version(target) {
		return spawn('adb', ['-s', target, 'shell', 'getprop', 'ro.build.version.sdk']);
	}

	static uninstall(target, packageId) {
		console.log('Uninstalling package ' + packageId + ' from target ' + target + '...');

		return spawn('adb', ['-s', target, 'uninstall', packageId], { cwd: os.tmpdir() });
	}

	static shell(target, shellCommand) {
		console.log('Running adb shell command "' + shellCommand + '" on target ' + target + '...');

		var args = ['-s', target, 'shell'];
		shellCommand = shellCommand.split(/\s+/);
		return spawn('adb', args.concat(shellCommand), { cwd: os.tmpdir() })
			.catch(function(output) {
				return Q.reject(new Error('Failed to execute shell command "' +
					shellCommand + '"" on device: ' + output));
			});
	}

	static start(target, activityName) {
		console.log('Starting application "' + activityName + '" on target ' + target + '...');

		return Adb.shell(target, 'am start -W -a android.intent.action.MAIN -n' + activityName)
			.catch(function(output) {
				return Q.reject(new Error('Failed to start application "' +
					activityName + '"" on device: ' + output));
			});
	}
}

module.exports = Adb;
