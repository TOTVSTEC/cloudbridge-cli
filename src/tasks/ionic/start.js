'use strict';

var path = require('path'),
	fs = require('fs'),
	shelljs = require('shelljs'),
	Q = require('q'),
	inquirer = require('inquirer'),
	TaskBase = require('./../task-base'),
	Package = cb_require('utils/package'),
	ionic = cb_require('utils/ionic'),
	npm = cb_require('utils/npm'),
	CloudBridgeProject = cb_require('project/project');

var utils = cli.utils,
	logging = cli.logging;


class StartTask extends TaskBase {

	run(cloudbridge, argv) {

		if (argv._.length < 2) {
			return utils.fail('Invalid command', 'start');
		}

		if (argv._[1] == '.') {
			console.log('Please name your CloudBridge project something more meaningful than \'.\''.red);
			return;
		}

		var promptPromise,
			options = utils.preprocessCliOptions(argv),
			startingApp = true;

		options.targetPath = path.join(this.projectDir, options.appDirectory);

		if (fs.existsSync(options.targetPath)) {
			var _argv = require('optimist').boolean(['list']).argv;

			promptPromise = StartTask.promptForOverwrite(options.targetPath, _argv);
		}
		else {
			promptPromise = Q(true);
		}

		return promptPromise
			.then(function(promptToContinue) {
				if (!promptToContinue) {
					startingApp = false;
					console.log('\nCloudBridge start cancelled by user.\n'.red.bold);
					return;
				}
				return StartTask.startApp(options);
			})
			.then(function() {
				if (startingApp) {
					StartTask.printQuickHelp(options);
				}
			})
			.catch(function(error) {
				utils.fail(error);
			});


	}

	static promptForOverwrite(targetPath, _argv) {
		var deferred = Q.defer(),
			choiceOverwrite = {
				name: 'Overwrite',
				value: 0,
				short: '\nOverwriting the existing files...'
			},
			choiceRename = {
				name: 'Rename',
				value: 1,
				short: '\nRenaming the existing directory and copying the new files...'
			};

		inquirer.prompt([{
			type: 'list',
			name: 'action',
			message: ['The directory'.error.bold, targetPath, 'already exists.\n'.error.bold].join(' '),
			choices: [choiceOverwrite, choiceRename],
			default: choiceRename.value
		}]).then(function(answers) {
			if (answers.action === choiceRename.value) {
				var renamedPath = targetPath + '.old';

				if (fs.existsSync(renamedPath)) {
					var count = 1;
					while (fs.existsSync(renamedPath + '.' + count)) {
						count++;
					}

					renamedPath += '.' + count;
				}

				shelljs.mv(targetPath, renamedPath);
			}
			else if (answers.action === choiceOverwrite.value) {
				shelljs.rm('-rf', targetPath);
			}

			deferred.resolve(true);
		});

		return deferred.promise;
	}

	static startApp(options) {
		var name = options.appDirectory,
			id = options.packageName,
			backend = ionic.config.get('backend', '--global');

		if (typeof options !== 'object' || typeof options === 'undefined') {
			throw new Error('You cannot start an app without options');
		}

		if (typeof options.targetPath == 'undefined' || options.targetPath == '.') {
			throw new Error('Invalid target path, you may not specify \'.\' as an app name');
		}

		return Q()
			.then(() => {
				var createMessage = [
					'\n\tCreating CloudBridge Ionic-like app in folder',
					options.targetPath,
					'based on',
					options.template.bold,
					'project',
					'\n'
				].join(' ');

				logging.logger.info(createMessage);

				if (backend !== 'legacy') {
					ionic.config.set('backend', 'legacy', '--global');
				}

				return ionic.start(name, 'blank', '--no-git', '--no-link', '--cordova', '--package-id=' + id);
			})
			.then(() => {
				if ((backend !== 'legacy') && (backend !== 'undefined')) {
					ionic.config.set('backend', backend, '--global');
				}

				// Tema do THF
				return npm.install('@totvs/mobile-theme', '--save', {
					cwd: options.targetPath
				});
			})
			.then(() => {
				return StartTask.createProjectFile(options);
			})
			.then(() => {
				return StartTask.fetchWrapper(options);
			})
			.then(() => {
				return StartTask.finalize(options);
			})
			.catch((err) => {
				logging.logger.error('Error Initializing app: %s', err, {});

				throw err;
			});
	}

	static printQuickHelp(options) {
		logging.logger.info('\n\nYour CloudBridge Ionic-like app is ready to go!'.bold);
		logging.logger.info('\n\nMake sure to cd into your new app directory:'.bold);
		logging.logger.info('  cd ' + options.appName);
		logging.logger.info('\nAdd some platforms:'.bold);
		logging.logger.info('  cloudbridge platform add android ios');
		logging.logger.info('\nTo build on android:'.bold);
		logging.logger.info('  cloudbridge build android');
		logging.logger.info('\nTo run on android:'.bold);
		logging.logger.info('  cloudbridge run android');
	}

	static fetchWrapper(options) {
		var pack = new Package('cloudbridge-core-ionic');

		return Q()
			.then(function() {
				return pack.latest();
			})
			.then(function() {
				options.version = pack.version;

				var project = CloudBridgeProject.load(options.targetPath),
					components = project.get('components') || {};

				components.advpl = components.advpl || {};
				components.advpl[pack.name] = '^' + pack.version;

				project.set('components', components);
				project.save();

				return pack.fetch();
			})
			.then(function() {
				var deferred = Q.defer();
				var projectData = require(path.join(options.targetPath, 'cloudbridge.json'));

				pack.install(options.targetPath, projectData)
					.then(function() {
						deferred.resolve();
					})
					.catch(function() {
						shelljs.cp('-Rf', path.join(pack.src, pack.version, 'src'), options.targetPath);
						shelljs.cp('-Rf', path.join(pack.src, pack.version, 'build'), options.targetPath);
						shelljs.cp('-Rf', path.join(pack.src, pack.version, 'plugins'), options.targetPath);
						//shelljs.cp('-Rf', path.join(pack.src, pack.version, 'www'), options.targetPath);

						shelljs.cd(options.targetPath);

						deferred.resolve();
					});

				return deferred.promise;
			});

	}

	static finalize(options) {
		try {
			// update the app name in the bower.json file
			var cloudbridgeBower = require('./bower').CloudBridgeBower;
			cloudbridgeBower.setAppName(options.appName);
		}
		catch (e) { }

		try {
			// remove the README file in the root because it
			// doesn't make sense because its the README for the repo
			// and not helper text while developing an app
			fs.unlinkSync(options.targetPath + '/README.md');
		}
		catch (e) { }
	}

	static createProjectFile(options) {
		try {
			// create the cloudbridge.json file and
			// set the app name
			var project = CloudBridgeProject.create(options.targetPath, options.appName);
			project.set('name', options.appName);

			if (options.packageName) {
				project.set('id', options.packageName);
			}

			project.set('engine', 'ionic');

			project.save(options.targetPath);
		}
		catch (e) {
			console.error('Error saving project file');
		}

		return Q();
	}

}

module.exports = StartTask;
