'use strict';

var Q = require('q'),
	child_process = require('child_process');

module.exports = function spawn(command, args, options) {
	var deferred = Q.defer();
	var child = child_process.spawn(command, args, options);
	var capturedOut = '';
	var capturedErr = '';

	if (child.stdout) {
		child.stdout.on('data', function(data) {
			capturedOut += data;
			deferred.notify({ 'stdout': data });
		});
	}

	if (child.stderr) {
		child.stderr.on('data', function(data) {
			capturedErr += data;
			deferred.notify({ 'stderr': data });
		});
	}

	child.on('close', whenDone);
	child.on('error', whenDone);

	function whenDone(arg) {
		child.removeListener('close', whenDone);
		child.removeListener('error', whenDone);

		var code = typeof arg == 'number' ? arg : arg && arg.code;

		if (code === 0) {
			deferred.resolve(capturedOut.trim());
		}
		else {
			var errMsg = command + ': Command failed with exit code ' + code;
			if (capturedErr) {
				errMsg += ' Error output:\n' + capturedErr.trim();
			}
			var err = new Error(errMsg);
			err.code = code;
			deferred.reject(err);
		}
	}

	return deferred.promise;
};
