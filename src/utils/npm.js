'use strict';

var Q = require('q'),
	path = require('path'),
	shelljs = require('shelljs'),
	spawn = require('./spawn');

var npm = require('npm');


class NPM {

	static install(packages, options) {
		let deferred = Q.defer();

		if (typeof packages === 'string') {
			packages = [packages];
		}

		npm.load({
			loaded: false
		}, function(error) {
			if (error) {
				console.log(error);
				deferred.reject(error);
				return;
			}

			npm.commands.install(packages, function(error, data) {
				if (error) {
					console.log(error);
					deferred.reject(error);
					return;
				}

				console.log(data);

				deferred.resolve();
			});

			npm.on("log", function(message) {
				// log the progress of the installation
				console.log(message);
			});
		});

		return deferred.promise;
	}

}
/*
	static install(packages, options) {
		let args = ['install'];

		options = options || {};
		options.cwd = options.cwd || process.cwd();

		if (typeof packages === 'string') {
			args.push(packages);
		}
		else if (Array.isArray(packages)) {
			args = args.concat(packages);
		}

		return spawn('npm', args, options)
			.then(function(output) {
				console.log("NPM INSTALL RESULT:", output);
			});
	}
}
*/

/*
NPM.install = function install(packages, options) {
	var deferred = Q.defer();

	bower.commands
		.install(packages, options, config)
		.on('end', function(result) {
			deferred.resolve(result);
		})
		.on('error', function(error) {
			deferred.reject(error);
		});

	return deferred.promise;
};

NPM.uninstall = function install(packages, userOptions, userConfig) {
	var deferred = Q.defer(),
		config = NPM.getConfig(userConfig),
		options = NPM.getOptions(userOptions);

	bower.commands
		.uninstall(packages, options, config)
		.on('end', function(result) {
			for (var i = 0; i < packages.length; i++) {
				shelljs.rm('-rf', path.join(config.directory, packages[i]));
			}

			deferred.resolve(result);
		})
		.on('error', function(error) {
			deferred.reject(error);
		});

	return deferred.promise;
};

NPM.list = function list(userOptions, userConfig) {
	var deferred = Q.defer(),
		config = NPM.getConfig(userConfig),
		options = NPM.getOptions(userOptions);

	options.paths = true;
	options.json = true;

	bower.commands.list(options, config)
		.on('end', function(result) {
			deferred.resolve(result);
		})
		.on('error', function(error) {
			deferred.reject(error);
		});

	return deferred.promise;
};
*/
module.exports = NPM;
