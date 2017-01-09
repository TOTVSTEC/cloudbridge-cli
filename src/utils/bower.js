'use strict';

var Bower = module.exports,
	Q = require('q'),
	path = require('path'),
	bower = require('bower'),
	shelljs = require('shelljs'),
	_ = require('underscore'),
	defaultConfig = { directory: path.join('build', 'bower') },
	defaultOptions = { save: true };

Bower.install = function install(packages, userOptions, userConfig) {
	var deferred = Q.defer(),
		config = Bower.getConfig(userConfig),
		options = Bower.getOptions(userOptions);

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

Bower.uninstall = function install(packages, userOptions, userConfig) {
	var deferred = Q.defer(),
		config = Bower.getConfig(userConfig),
		options = Bower.getOptions(userOptions);

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

Bower.list = function list(userOptions, userConfig) {
	var deferred = Q.defer(),
		config = Bower.getConfig(userConfig),
		options = Bower.getOptions(userOptions);

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

Bower.info = function info(packageName, userOptions, userConfig) {
	var deferred = Q.defer(),
		config = Bower.getConfig(userConfig);

	bower.commands.info(packageName, null, config)
		.on('end', function(result) {
			deferred.resolve(result);
		})
		.on('error', function(error) {
			deferred.reject(error);
		});

	return deferred.promise;
};


Bower.getConfig = function getConfig(userConfig) {
	var config = {};

	_.extend(config, defaultConfig, userConfig);

	return config;
};

Bower.getOptions = function getOptions(userOptions) {
	var options = {};

	_.extend(options, defaultOptions, userOptions);

	return options;
};
