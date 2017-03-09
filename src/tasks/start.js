'use strict';

var fs = require('fs'),
	path = require('path'),
	request = require('request'),
	shelljs = require('shelljs'),
	inquirer = require('inquirer'),
	Q = require('q'),
	Package = cb_require('utils/package'),
	StartListTask = cb_require('tasks/start-list'),
	CloudBridgeProject = cb_require('project/project'),
	Task = cb_require('tasks/task');


var utils = cli.utils,
	logging = cli.logging;

class StartTask extends Task {

	run(cloudbridge, argv) {
		if (argv.list || argv.l) {
			var listTask = new StartListTask(this.options);

			return listTask.run(cloudbridge);
		}

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

	// Options for startApp:
	// {
	//   appDirectory: 'CloudBridgeApp',
	//   appName: 'Test',
	//   packageName: 'com.cloudbridge.test,
	//   template: 'tabs',
	//   targetPath: '/User/Path/Development/'
	// }
	static startApp(options) {
		if (typeof options != 'object' || typeof options == 'undefined') {
			throw new Error('You cannot start an app without options');
		}

		if (typeof options.targetPath == 'undefined' || options.targetPath == '.') {
			throw new Error('Invalid target path, you may not specify \'.\' as an app name');
		}

		shelljs.mkdir('-p', options.targetPath);

		var createMessage = ['Creating CloudBridge app in folder ', options.targetPath, ' based on ', options.template.bold, ' project'].join('');
		var errorWithStart = false;

		logging.logger.info(createMessage);

		return StartTask.createProjectFile(options)
			.then(function() {
				return StartTask.fetchWrapper(options);
			})
			.then(function() {
				return StartTask.fetchSeed(options);
			})
			.catch(function(ex) {
				errorWithStart = true;
				throw ex;
			})
			.then(function() {
				return StartTask.finalize(options);
			})
			.catch(function(err) {
				logging.logger.error('Error Initializing app: %s', err, {});
				// throw new Error('Unable to initalize app:')
				throw err;
			})
			.fin(function() {
				return 'Completed successfully';
			});
	}

	static printQuickHelp(options) {
		logging.logger.info('\n\nYour CloudBridge app is ready to go!'.bold);
		logging.logger.info('\n\nMake sure to cd into your new app directory:'.bold);
		logging.logger.info('  cd ' + options.appName);
		logging.logger.info('\nAdd some platforms:'.bold);
		logging.logger.info('  cloudbridge platform add windows android');
		logging.logger.info('\nTo build on windows:'.bold);
		logging.logger.info('  cloudbridge build windows');
		logging.logger.info('\nTo run on Windows:'.bold);
		logging.logger.info('  cloudbridge run windows');
	}

	static fetchWrapper(options) {
		var pack = new Package('cloudbridge-core-advpl');

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
						shelljs.cp('-Rf', path.join(pack.src, 'src'), options.targetPath);
						shelljs.cp('-Rf', path.join(pack.src, 'build'), options.targetPath);

						shelljs.cd(options.targetPath);

						deferred.resolve();
					});

				return deferred.promise;
				//
				/*
			})
			.then(function() {
				return _this.save(options);
				*/
			});

		/*
		utils.fetchPackage(fetchOptions)
			.then(function(packageDir) {
				//options.src = packageDir;
				shelljs.cp('-Rf', path.join(packageDir, 'src'), wrapperOptions.targetPath);
				shelljs.cp('-Rf', path.join(packageDir, 'build'), wrapperOptions.targetPath);

				shelljs.cd(options.targetPath);
				//return _this.install(options);

				q.resolve();
			}, function(err) {
				q.reject(err);
			}).catch(function(err) {
				q.reject('Error: Unable to fetch wrapper repo: ' + err);
				// return utils.fail('Error: Unable to fetch wrapper repo: ' + err);
			});

		return q.promise;
		*/
	}

	//Tested
	static fetchSeed(options) {
		var seedType;

		// Codepen: http://codepen.io/cloudbridge/pen/GpCst
		if (/\/\/codepen.io\//i.test(options.template)) {
			seedType = 'codepen';
			return StartTask.fetchCodepen(options);
		}

		if (/plnkr.co\//i.test(options.template)) {
			seedType = 'plnkr';
			return StartTask.fetchPlnkr(options);
		}

		// Github URL: http://github.com/myrepo/
		if (/\/\/github.com\//i.test(options.template)) {
			seedType = 'github';
			return StartTask.fetchGithubStarter(options, options.template);
		}

		if (options.zipFileDownload) {
			return StartTask.fetchZipStarter(options);
		}

		// Local Directory: /User/starterapp
		if ((options.template.indexOf('/') > -1 || options.template.indexOf('\\') > -1) && (options.template.indexOf('http://') === -1 && options.template.indexOf('https://') === -1)) {
			// TODO: seedType - how to pass back?
			seedType = 'local';
			return StartTask.fetchLocalStarter(options);
		}

		// CloudBridge Github Repo
		seedType = 'cloudbridge-template';
		return StartTask.fetchCloudBridgeStarter(options);
	}

	static fetchCodepen(options) {
		var codepenUrl = options.template.split('?')[0].split('#')[0];
		var wwwPath = path.join(options.targetPath, 'www');

		if (codepenUrl[codepenUrl.length - 1] == '/') {
			codepenUrl = codepenUrl.substr(0, codepenUrl.length - 1);
		}

		logging.logger.info('Downloading Codepen: ', codepenUrl.green.bold);

		var qHTML = Q.defer();
		var qCSS = Q.defer();
		var qJS = Q.defer();

		var proxy = process.env.PROXY || process.env.http_proxy || null;

		request({ url: codepenUrl + '.html', proxy: proxy }, function(err, res, html) {
			if (!err && res && res.statusCode === 200) {
				html = html || '';

				if (html.indexOf('<!DOCTYPE html>') < 0) {
					html = '<!DOCTYPE html>\n' + html;
				}

				var content = '	<link href="css/style.css" rel="stylesheet">\n' +
					'	<script src="js/app.js"></script>\n';

				content += '  </head>';

				html = html.replace(/<\/head>/i, '\n' + content);

				html = StartTask.convertTemplates(html);

				fs.writeFileSync(path.join(wwwPath, 'index.html'), html, 'utf8');
			}
			qHTML.resolve();
		});

		request({ url: codepenUrl + '.css', proxy: proxy }, function(err, res, css) {
			if (!err && res && res.statusCode === 200) {
				css = css || '';

				var cssPath = path.join(wwwPath, 'css');
				if (!fs.existsSync(cssPath)) {
					fs.mkdirSync(cssPath);
				}
				css = css.replace("cursor: url('http://cloudbridgeframework.com/img/finger.png'), auto;", '');
				fs.writeFileSync(path.join(cssPath, 'style.css'), css, 'utf8');
			}
			qCSS.resolve();
		});

		request({ url: codepenUrl + '.js', proxy: proxy }, function(err, res, js) {
			if (!err && res && res.statusCode === 200) {
				js = js || '';

				var jsPath = path.join(wwwPath, 'js');
				if (!fs.existsSync(jsPath)) {
					fs.mkdirSync(jsPath);
				}
				fs.writeFileSync(path.join(jsPath, 'app.js'), js, 'utf8');
			}
			qJS.resolve();
		});

		return Q.all([qHTML.promise, qCSS.promise, qJS.promise]);
	}

	static convertTemplates(html, targetPath) {
		var templates = [];
		// var self = this;

		try {
			var scripts = html.match(/<script [\s\S]*?<\/script>/gi);
			scripts.forEach(function(scriptElement) {
				if (scriptElement.indexOf('text/ng-template') > -1) {

					var lines = scriptElement.split('\n');
					for (var x = 0; x < lines.length; x++) {
						try {
							if (lines[x].substr(0, 6) === '	  ') {
								lines[x] = lines[x].substr(6);
							}
						}
						catch (lE) { }
					}
					var data = lines.join('\n');

					var id = data.match(/ id=["|'](.*?)["|']/i)[0];
					id = id.replace(/'/g, '"').split('"')[1];

					data = data.replace(/<script [\s\S]*?>/gi, '');
					data = data.replace(/<\/script>/gi, '');
					data = data.trim();

					templates.push({
						path: id,
						scriptElement: scriptElement,
						html: data
					});

				}
			});
		}
		catch (e) { }

		try {

			templates.forEach(function(tmpl) {

				var tmpPath = path.join(targetPath, 'www', path.dirname(tmpl.path));
				if (!fs.existsSync(tmpPath)) {
					fs.mkdirSync(tmpPath);
				}

				tmpPath = path.join(targetPath, 'www', tmpl.path);
				fs.writeFileSync(tmpPath, tmpl.html, 'utf8');

				html = html.replace(tmpl.scriptElement, '');
				html = html.replace(/	\n	\n/g, '');
			});

		}
		catch (e) { }

		return html;
	}

	static fetchLocalStarter(options) {
		var q = Q.defer();

		try {
			shelljs.cd('..');

			var localStarterPath = path.resolve(options.template);

			if (!fs.existsSync(localStarterPath)) {
				utils.fail('Unable to find local starter template: ' + localStarterPath);
				q.reject();
				return q.promise;
			}

			logging.logger.info('\nCopying files to www from:'.bold, localStarterPath);

			// Move the content of this repo into the www folder
			shelljs.cp('-Rf', path.join(localStarterPath, '*'), path.join(options.targetPath, 'www'));

			q.resolve();
		}
		catch (e) {
			q.reject(e);
		}

		shelljs.cd(options.targetPath);

		return q.promise;
	}

	static fetchCloudBridgeStarter(options) {
		var packageOptions = {
			name: 'cloudbridge-template-' + options.template,
			group: 'totvstec'
		};

		return StartTask.fetchGithubStarter(options, packageOptions);
	}

	static fetchGithubStarter(options, packageOptions) {
		var pack = new Package(packageOptions);

		return pack.latest()
			.then(() => {
				return pack.fetch();
			})
			.then(() => {
				return pack.install(options.targetPath, {});
			});
	}

	static fetchZipStarter(options) {
		var q = Q.defer();
		var repoFolderName = 'zipFileDownload';

		logging.logger.info('Fetching ZIP from url:', options.zipFileDownload.bold, 'to: ', options.targetPath);

		utils.fetchArchive(options.targetPath, options.zipFileDownload)
			.then(function() {

				try {
					// Move the content of this repo into the www folder
					shelljs.cp('-Rf', options.targetPath + '/' + repoFolderName + '/.', '/.');

					// Clean up start template folder
					shelljs.rm('-rf', options.targetPath + '/' + repoFolderName + '/');

					q.resolve();

				}
				catch (e) {
					q.reject(e);
				}

			}).catch(function(err) {
				logging.logger.error(err);
				logging.logger.error('Please verify you are using a valid URL or a valid cloudbridge starter.');
				logging.logger.error('View available starter templates: `cloudbridge templates`');
				logging.logger.error('More info available at: \nhttp://cloudbridgeframework.com/getting-started/\nhttps://github.com/totvstec/cloudbridge-cli');

				return utils.fail('');
			});

		return q.promise;
	}

	static fetchPlnkr(options) {
		// var self = this;
		var q = Q.defer();

		var plnkrUrl = options.template.split('?')[0].split('#')[0];

		var plnkrId = null;

		//Given any of these urls - we need to extract the ID
		//http://embed.plnkr.co/dFvL8n/preview
		//http://run.plnkr.co/plunks/dFvL8n/#/tabs/friends
		//http://api.plnkr.co/plunks/dFvL8n

		// http://embed.plnkr.co/BZrnKPlCJt93orQp58H3/preview

		//To download, we want http://api.plnkr.co/plunks/dFvL8n.zip

		if (plnkrUrl[plnkrUrl.length - 1] == '/') {
			plnkrUrl = plnkrUrl.substr(0, plnkrUrl.length - 1);
		}

		var plnkrSplit = plnkrUrl.split('/');

		// api link - need zip on end.
		if (plnkrUrl.indexOf('embed.plnkr.co') != -1) {
			plnkrId = plnkrSplit[3];
		}
		else if (plnkrUrl.indexOf('run.plnkr.co') != -1 || plnkrUrl.indexOf('api.plnkr.co') != -1) {
			plnkrId = plnkrSplit[plnkrSplit.length - 1];

			if (plnkrId.indexOf('.zip') != -1) {
				plnkrId = plnkrId.replace('.zip', '');
			}
		}

		plnkrUrl = ['http://api.plnkr.co/plunks/', plnkrId, '.zip'].join('');

		logging.logger.info('\nDownloading Plnkr url:', plnkrUrl);

		var extractPath = path.join(options.targetPath, 'plnkr');

		utils.fetchArchive(extractPath, plnkrUrl)
			.then(function() {
				try {
					// Move the content of this repo into the www folder
					var copyDir = [extractPath, '/*'].join('');
					shelljs.cp('-Rf', copyDir, 'www');
					// Clean up start template folder
					shelljs.rm('-rf', extractPath + '/');
					q.resolve();

				}
				catch (e) {
					q.reject(e);
				}
			});

		return q.promise;
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

			project.save(options.targetPath);
			logging.logger.debug('Saved project file');
		}
		catch (e) {
			logging.logger.error('Error saving project file');
		}

		return Q();
	}

}

module.exports = StartTask;
