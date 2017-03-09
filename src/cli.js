'use strict';

var Cli = module.exports,
	CliHelp = cb_require('help'),
	path = require('path'),
	optimist = require('optimist'),
	Q = require('q'),
	Info = cb_require('utils/info'),
	settings = require(__basedir + '/package.json'),
	TASKS = cb_require('tasks/task-list'),
	Updates = cb_require('utils/updates');

Cli.utils = cb_require('utils/utils');
Cli.logging = cb_require('utils/logging');

// The main entry point for the CLI
// This takes the process.argv array for arguments
// The args passed should be unfiltered.
// From here, we will filter the options/args out
// using optimist. Each command is responsible for
// parsing out the args/options in the way they need.
// This way, we can still test with passing in arguments.
Cli.run = function run(processArgv, processCwd) {
	this.cwd = processCwd || process.cwd();

	try {
		//First we parse out the args to use them.
		//Later, we will fetch the command they are trying to
		//execute, grab those options, and reparse the arguments.
		var argv = optimist(processArgv.slice(2)).argv;

		if (argv.chronometer)
			Cli.startChronometer();

		this.logging.setUpConsoleLoggingHelpers();
		Cli.attachErrorHandling();

		Updates.checkLatestVersion();

		process.on('exit', function() {
			Cli.printVersionWarning();
		});

		//Before taking any more steps, lets check their
		//environment and display any upgrade warnings
		Updates.doRuntimeCheck(settings.version);

		if ((argv.version || argv.v) && (!argv._.length)) {
			return Cli.version();
		}

		if (argv.verbose) {
			this.logging.logger.level = 'debug';
		}

		if (argv.help || argv.h) {
			return CliHelp.printHelpLines();
		}

		var taskSetting = Cli.tryBuildingTask(argv);
		if (!taskSetting) {
			return CliHelp.printAvailableTasks();
		}

		var booleanOptions = Cli.getBooleanOptionsForTask(taskSetting);

		argv = optimist(processArgv.slice(2)).boolean(booleanOptions).argv;

		var TaskModule = Cli.lookupTask(taskSetting.name);
		var taskInstance = new TaskModule({ target: this.cwd });
		var promise = taskInstance.prepare()
			.then(() => taskInstance.run(Cli, argv));

		promise
			.catch(function(ex) {
				console.error(ex);
			})
			.done(function onFulfilled() {
				if (argv.chronometer)
					Cli.endChronometer();

				Cli.processExit();
			},
			function onRejected() {
				console.log('Fail!');
				console.log(arguments);

				Cli.processExit(1);
			}/*,
			function onProgress(output) {
				if (output.stdout)
					console.log(output.stdout.toString());

				if (output.stderr)
					console.error(output.stderr.toString());
			}*/);

		return promise;
	}
	catch (ex) {
		this.logging.logger.debug('Cli.Run - Error', ex);
		return this.utils.fail(ex);
	}
};

Cli.startChronometer = function startChronometer() {
	Cli.chronometer = process.hrtime();
};

Cli.endChronometer = function endChronometer() {
	let diff = process.hrtime(Cli.chronometer),
		elapsed = (diff[0] + (diff[1] / 1e9));

	console.log('Chronometer: ' + elapsed.toFixed(3) + 'secs');
};

Cli.getBooleanOptionsForTask = function getBooleanOptionsForTask(task) {
	var availableTaskOptions = task.options;
	var booleanOptions = [];

	if (availableTaskOptions) {
		for (var key in availableTaskOptions) {
			if (typeof availableTaskOptions[key] == 'string') {
				continue;
			}
			var optionWithPipe = key;
			var optionsSplit = optionWithPipe.split('|');
			booleanOptions.push(optionsSplit[0].substring(2));
			if (optionsSplit.length == 2) {
				booleanOptions.push(optionsSplit[1].substring(1));
			}
		}
	}

	return booleanOptions;
};

Cli.lookupTask = function lookupTask(module) {
	try {
		var taskModule = cb_require('tasks/' + module);
		return taskModule;
	}
	catch (ex) {
		throw ex;
	}
};

Cli.printVersionWarning = function printVersionWarning() {
	if (Cli.npmVersion && Cli.npmVersion != settings.version.trim()) {
		process.stdout.write('\n------------------------------------\n'.red);
		process.stdout.write('CloudBridge CLI is out of date:\n'.bold.yellow);
		process.stdout.write((' * Locally installed version: ' + settings.version + '\n').yellow);
		process.stdout.write((' * Latest version: ' + Cli.npmVersion + '\n').yellow);
		process.stdout.write((' * https://github.com/totvstec/cloudbridge-cli/blob/master/CHANGELOG.md\n').yellow);
		process.stdout.write(' * Run '.yellow + 'npm install -g cloudbridge'.bold + ' to update\n'.yellow);
		process.stdout.write('------------------------------------\n\n'.red);
		Cli.npmVersion = null;
	}
};



Cli.tryBuildingTask = function tryBuildingTask(argv) {
	if (argv._.length === 0) {
		return false;
	}
	var taskName = argv._[0];

	return TASKS.getTaskWithName(taskName);
};



Cli.printCloudBridge = function printCloudBridge() {
	var w = function(s) {
		process.stdout.write(s.bold);
	};

	w("   ________                ______       _     __\n");
	w("  / ____/ /___  __  ______/ / __ )_____(_)___/ /___ ____ \n");
	w(" / /   / / __ \\/ / / / __  / __  / ___/ / __  / __ `/ _ \\\n");
	w("/ /___/ / /_/ / /_/ / /_/ / /_/ / /  / / /_/ / /_/ /  __/\n");
	w("\\____/_/\\____/\\__,_/\\__,_/_____/_/  /_/\\__,_/\\__, /\\___/ \n");
	w("                                            /____/\n");
	w("By TOTVS                                          v" + settings.version + "\n");
};

Cli.printAvailableTasks = function printAvailableTasks(argv) {
	Cli.printCloudBridge();
	process.stderr.write('\nUsage: cloudbridge task args\n\n=======================\n\n');

	if (process.argv.length > 2) {
		process.stderr.write((process.argv[2] + ' is not a valid task\n\n').bold.red);
	}

	process.stderr.write('Available tasks: '.bold);
	process.stderr.write('(use --help or -h for more info)\n\n');

	for (var i = 0; i < TASKS.length; i++) {
		var task = TASKS[i];
		if (task.summary) {
			var name = '   ' + task.name + '  ';
			var dots = '';
			while ((name + dots).length < 20) {
				dots += '.';
			}
			process.stderr.write(name.green.bold + dots.grey + '  ' + task.summary.bold + '\n');
		}
	}

	process.stderr.write('\n');
	Cli.processExit();

	return Q();
};

Cli.processExit = function processExit(code) {
	if (process.env.NODE_ENV === 'test')
		return;

	if (Cli.cliNews && Cli.cliNews.promise) {
		Q.all([Cli.latestVersion.promise, Cli.cliNews.promise])
			.then(function() {
				process.exit(code);
			});
	}
	else {
		Cli.latestVersion.promise.then(function() {
			process.exit(code);
		});
	}
};

Cli.version = function version() {
	console.log(settings.version + '\n');
};

//A little why on this reportExtras here -
//We need to access the CLI's package.json file
//for that, we need the path to be relative to this,
//not the node_module/cloudbridge-app-lib directory
Cli.reportExtras = function reportExtras(err) {
	var commandLineInfo = process.argv;
	var info = Cli.gatherInfo();
	info.command = commandLineInfo;
	return info;
};

Cli.gatherInfo = function gatherInfo() {
	var info = Info.gatherInfo();
	Info.getCloudBridgeVersion(info, process.cwd());
	Info.getCloudBridgeCliVersion(info, path.join(__dirname, '../'));
	return info;
};

Cli.handleUncaughtExceptions = function handleUncaughtExceptions(err, url) {
	console.log('An uncaught exception occurred and has been reported to CloudBridge'.error.bold);
	var errorMessage = typeof err === 'string' ? err : err.message;
	this.utils.errorHandler(errorMessage);
	process.exit(1);
};

Cli.attachErrorHandling = function attachErrorHandling() {
	this.utils.errorHandler = function errorHandler(msg, taskHelp) {
		try {
			cli.logging.logger.debug('cli.utils.errorHandler msg', msg, typeof msg);

			var stack = typeof msg == 'string' ? '' : msg.stack;
			var errorMessage = typeof msg == 'string' ? msg : msg.message;
			// console.log('stack', stack, arguments.caller);
			if (msg) {
				var info = Cli.gatherInfo();
				var cloudbridgeCliVersion = info.cloudbridge_cli;
				process.stderr.write('\n' + stack.error.bold + '\n\n');
				process.stderr.write(errorMessage.error.bold);
				process.stderr.write((' (CLI v' + cloudbridgeCliVersion + ')').error.bold + '\n');

				Info.printInfo(info);
			}
			process.stderr.write('\n');
			process.exit(1);
			return '';
		}
		catch (ex) {
			console.log('errorHandler had an error', ex);
			console.log(ex.stack);
		}
	};
};

//Backwards compatability for those commands that havent been
//converted yet.
Cli.fail = function fail(err, taskHelp) {
	// var error = typeof err == 'string' ? new Error(err) : err;
	this.utils.fail(err, taskHelp);
};

Cli.require = function(name) {
	if ((name.substring(0, 1) === '/') ||
		(name.substring(0, 2) === './') ||
		(name.substring(0, 3) === '../')) {
		return require(path.join(__basedir, name));
	}

	return require(name);
};

Cli.cb_require = cb_require;
