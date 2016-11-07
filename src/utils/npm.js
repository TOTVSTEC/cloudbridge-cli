'use strict';

var	Q = require('q'),
	path = require('path'),
	bower = require('child_process'),
	shelljs = require('shelljs'),
	_ = require('underscore'),
	defaultConfig = { directory: path.join('build', 'bower') },
	defaultOptions = { save: true },
	NPM = module.exports;

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

NPM.getConfig = function getConfig(userConfig) {
	var config = {};

	_.extend(config, defaultConfig, userConfig);

	return config;
};

NPM.getOptions = function getOptions(userOptions) {
	var options = {};

	_.extend(options, defaultOptions, userOptions);

	return options;
};
