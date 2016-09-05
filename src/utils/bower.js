'use strict';

var Bower = module.exports,
	Q = require('q'),
	path = require('path'),
	bower = require('bower'),
	shelljs = require('shelljs'),
	config = {	directory: path.join('build', 'bower')	},
	options = { save: true };

Bower.install = function install(packages) {
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

Bower.uninstall = function install(packages) {
	var deferred = Q.defer();

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

Bower.list = function list() {
	var deferred = Q.defer();
	var listOptions = { paths: true, json: true };

	bower.commands.list(listOptions, config)
		.on('end', function(result) {
			deferred.resolve(result);
		})
		.on('error', function(error) {
			deferred.reject(error);
		});

	return deferred.promise;
};
