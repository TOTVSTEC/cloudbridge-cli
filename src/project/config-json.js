'use strict';

var fs = require('fs'),
	path = require('path'),
	Q = require('q'),
	Utils = cb_require('utils/utils'),
	logging = cb_require('utils/logging');

var SETTINGS_FILE = 'cloudbridge.json';

var ConfigJson = module.exports;

ConfigJson.write = function(appDirectory, options) {

};

ConfigJson.loadToJson = function(appDirectory, options) {
	var d = Q.defer();

	if (!appDirectory) {
		appDirectory = process.cwd();
	}

	var configXmlPath = path.join(appDirectory, SETTINGS_FILE);
	var file = path.join(appDirectory, SETTINGS_FILE);

	fs.readFile(configXmlPath, { encoding: 'utf8' }, function(err, data) {
		if (err)
			return d.reject(err);

		var configData = JSON.parse(data);
		d.resolve(configData);
	});

	return d.promise;
};

ConfigJson.loadToStream = function(appDirectory) {
	if (!appDirectory) {
		appDirectory = process.cwd();
	}

	return fs.createReadStream(path.join(appDirectory, SETTINGS_FILE));
};

ConfigJson.setConfigJson = function setConfigJson(appDirectory, options) {
	var madeChange = false;

	if (!appDirectory) {
		appDirectory = process.cwd();
	}

	logging.logger.debug('ConfigJson.setConfigJson', appDirectory, options);

	var configXmlPath = path.join(appDirectory, SETTINGS_FILE);

	if (!fs.existsSync(configXmlPath)) {
		// working directory does not have the ' + SETTINGS_FILE + ' file
		if (options.errorWhenNotFound) {
			return Q.reject('Unable to locate ' + SETTINGS_FILE + ' file. Please ensure the working directory is at the root of the app where the ' + SETTINGS_FILE + ' should be located.');
		}
	}

	return ConfigJson.loadToJson(appDirectory, options)
		.then(function(configJson) {
			if (!configJson.main) {
				throw new Error('\nYour ' + SETTINGS_FILE + ' file does not have a <content> element. \nAdd something like: <content src="index.html"/>');
			}

			/*
			if (options.devServer) {
				if (!configJson.main.$['original-src']) {
					configJson.main.$['original-src'] = configJson.main.$.src;
					madeChange = true;
				}
				if (configJson.main.$.src !== options.devServer) {
					configJson.main.$.src = options.devServer;
					madeChange = true;
				}
			}
			else if (options.resetContent) {
				if (configJson.main.$['original-src']) {
					configJson.main.$.src = configJson.main.$['original-src'];
					delete configJson.main.$['original-src'];
					madeChange = true;
				}
			}
			*/

			if (madeChange) {
				var configString = JSON.stringify(configJson, null, 2);

				fs.writeFileSync(configXmlPath, configString);
			}
		});
};
