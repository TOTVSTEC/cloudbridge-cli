'use strict';

var Logging = module.exports,
	colors = require('colors'),
	winston = require('winston');

Logging.winston = winston;

Logging.logger = new winston.Logger({
	exitOnError: false,
	transports: [
		new (winston.transports.Console)({
			name: 'console',
			showLevel: false
		})
	]
});

// To be used by helpers createDefaultLogger and createLoggerWithFile
Logging.createLogger = function createLogger(transports, level) {
	level = level || 'info';

	Logging.logger = new winston.Logger({
		exitOnError: false,
		level: level,
		transports: transports
	});

	return Logging.logger;
};

Logging.createDefaultLogger = function createDefaultLogger(level) {
	level = level || 'info';
	var transports = [
		new (winston.transports.Console)({
			name: 'console',
			showLevel: false
		})
	];
	return Logging.createLogger(transports, level);
};

Logging.createLoggerWithFile = function createLoggerWithFile(logFilePath, level) {
	var transports = [
		new (winston.transports.File)({
			filename: logFilePath,
			name: 'file'
		})
	];
	return Logging.createLogger(transports, level);
};

Logging.queryLogs = function queryLogs(searchText, timestamp) {
	var searchDate = new Date(timestamp) || new Date();
	var options = {
		from: new Date() - (24 * 60 * 60 * 1000),
		until: searchDate,
		limit: 10,
		start: 0,
		order: 'desc',
		fields: ['message', 'level']
	};

	//
	// Find items logged between today and yesterday.
	//
	winston.query(options, function(err, results) {
		if (err) {
			throw err;
		}

		console.log(results);
	});
};

Logging.setUpConsoleLoggingHelpers = function setUpConsoleLoggingHelpers() {
	colors.setTheme({
		silly: 'rainbow',
		input: 'grey',
		small: 'grey',
		verbose: 'cyan',
		prompt: ['yellow', 'bold'],
		info: 'white',
		data: 'grey',
		help: 'cyan',
		warn: 'yellow',
		debug: 'blue',
		error: 'red'
	});

	var consoleInfo = console.info;
	console.info = function() {
		if (arguments.length === 1 && !arguments[0])
			return;

		var msg = '';
		for (var n in arguments) {
			msg += arguments[n] + ' ';
		}

		consoleInfo.call(console, msg.blue.bold);
	};

	var consoleError = console.error;
	console.error = function() {
		if (arguments.length === 1 && !arguments[0])
			return;

		var msg = ' ✗';

		for (var n in arguments) {
			msg += ' ' + arguments[n];
		}

		consoleError.call(console, msg.red.bold);
	};

	console.success = function() {
		if (arguments.length === 1 && !arguments[0])
			return;

		var msg = ' ✓';
		for (var n in arguments) {
			msg += ' ' + arguments[n];
		}

		console.log(msg.green.bold);
	};

	//Default level is set to 'info'
	Logging.createDefaultLogger();
};
