'use strict';

var fs = require('fs'),
	os = require('os'),
	path = require('path'),
	Q = require('q'),
	shelljs = require('shelljs'),
	unzip = require('unzip'),
	archiver = require('archiver'),
	request = require('request'),
	requestProgress = require('request-progress'),
	logging = require('./logging'),
	usernameSync = require('username').sync,
	ejs = require('ejs');

require('colors');

var ProgressBar = require('progress');

var Utils = module.exports;

// Utils.useMultiBar = true;

Utils.errorHandler = null;

/**
 * Utils.createArchive will zip up a subdirectory in the app directory
 *
 * Utils.createArchive(appDirectory, 'www') makes a zip file at
 * {appDirectory}/www.zip whose file structure is like www.zip/www/{assets}
 *
 * @param {string} appDirectory The app's absolute directory
 * @param {string} documentRoot Denotation of the subdirectory, e.g. 'www'
 *
 * @return {Promise}
 */
Utils.createArchive = function(appDirectory, documentRoot) {
	var q = Q.defer();
	var zipPath = path.join(appDirectory, documentRoot);

	logging.logger.debug('Now zipping contents of ' + zipPath);

	if (!fs.existsSync(zipPath)) {
		q.reject(documentRoot + ' directory cannot be found. Make sure the working directory is at the top level of an CloudBridge project.', 'upload');
	}

	var zipDestination = zipPath + ".zip";
	var zip = fs.createWriteStream(zipDestination);

	var archive = archiver('zip');
	archive.pipe(zip);

	archive.bulk([
		{ expand: true, cwd: zipPath, src: ['**'] }
	]);

	archive.finalize(function(err, bytes) {
		if (err) {
			q.reject(['Error uploading: ', err].join(''));
		}
	});

	zip.once('close', function() {
		q.resolve(zipDestination);
	});

	return q.promise;
};


Utils.fetchPackage = function fetchPackage(options) {
	if (typeof options === 'string') {
		options = {
			package: options
		};
	}

	options.group = options.group || 'totvstec';
	options.version = options.version || 'master';

	var homeDir = process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH,
		packageDir = path.join(homeDir, '.cloudbridge', 'packages', options.group, options.package),
		outputDir = path.join(packageDir, options.version),
		url = 'https://github.com/' + options.group + '/' + options.package + '/archive/' + options.version + '.zip';

	if (shelljs.test('-d', outputDir)) {
		return Q.fcall(function() {
			return outputDir;
		});
	}

	shelljs.mkdir('-p', packageDir);

	return Utils.fetchArchive(packageDir, url, false).then(function() {
		var contentDir = path.join(packageDir, options.package + '-' + options.version);

		shelljs.mv(contentDir, outputDir);

		return outputDir;
	});
};

Utils.copyPackage = function copyPackage(options) {
	var targetDir = path.join(options.project.dir, 'build', 'packages', options.package);

	shelljs.rm('-rf', targetDir);
	shelljs.mkdir('-p', targetDir);
	shelljs.cp('-Rf', path.join(options.src, '*'), targetDir);
};


Utils.fetchArchive = function fetchArchive(targetPath, archiveUrl, isGui) {
	var q = Q.defer();

	// The folder name the project will be downloaded and extracted to
	var message = ['\nDownloading:'.bold, archiveUrl].join(' ');
	logging.logger.info(message);

	var tmpFolder = os.tmpdir();
	var tempZipFilePath = path.join(tmpFolder, 'cloudbridge-' + new Date().getTime() + '.zip');

	var unzipRepo = function unzipRepo(fileName) {
		var readStream = fs.createReadStream(fileName);
		readStream.once('error', function(err) {
			logging.logger.debug(('unzipRepo readStream: ' + err).error);
			q.reject(err);
		});

		var writeStream = unzip.Extract({ path: targetPath });
		writeStream.once('close', function() {
			q.resolve();
		});
		writeStream.once('error', function(err) {
			logging.logger.debug(('unzipRepo writeStream: ' + err).error);
			q.reject(err);
		});
		readStream.pipe(writeStream);
	};

	var proxy = process.env.PROXY || process.env.http_proxy || null;
	var r = request({ url: archiveUrl, rejectUnauthorized: false, encoding: null, proxy: proxy }, function(err, res, body) {
		if (err) {
			// console.error('Error fetching:'.error.bold, archiveUrl, err);
			q.reject(err);
			return;
		}
		if (!res) {
			console.error('Invalid response:'.error.bold, archiveUrl);
			q.reject('Unable to fetch response: ' + archiveUrl);
			return;
		}
		if (res.statusCode !== 200) {
			if (res.statusCode === 404 || res.statusCode === 406) {
				console.error('Not found:'.error.bold, archiveUrl, '(' + res.statusCode + ')');
				console.error('Please verify the url and try again.'.error.bold);
			}
			else {
				console.error('Invalid response status:'.error.bold, archiveUrl, '(' + res.statusCode + ')');
			}
			q.reject(res);
			return;
		}
		try {
			fs.writeFileSync(tempZipFilePath, body);
			unzipRepo(tempZipFilePath);
		}
		catch (e) {
			logging.logger.debug('fetchArchive request write: ', e);
			q.reject(e);
		}
	});

	if (!isGui) {
		var bar = null,
			oldPercent = 0,
			p = requestProgress(r, {
				throttle: 500
			});

		r.on('response', function(res) {
			//bar = Multibar.newBar(
			bar = new ProgressBar(':percent\t:bar\t:etas', {
				complete: String.fromCharCode(9608).blue.bold,
				incomplete: String.fromCharCode(9617).gray.dim,
				width: 30,
				total: 100
			});

			p.on('progress', function(state) {
				var newPercent = Math.ceil(100 * state.percent);
				if (newPercent !== oldPercent) {
					bar.tick(newPercent - oldPercent);
					oldPercent = newPercent;
				}
			}).once('end', function() {
				p.removeAllListeners('progress');
				r.removeAllListeners('response');

				bar.tick(100);
				console.log();
			});
		});

		/*
		r.once('progress', function(state) {
			//bar = Multibar.newBar(
			bar = new ProgressBar(':percent\t:bar\t:etas', {
				complete: String.fromCharCode(9608).blue.bold,
				incomplete: String.fromCharCode(9608).gray.dim,
				width: 30,
				total: 100	//state.size.total
			});

			r.on('progress', function(state) {
				var newPercent = Math.ceil(100 * state.percent);
				if (newPercent !== oldPercent) {
					bar.tick(newPercent - oldPercent);
					oldPercent = newPercent;
				}
				//console.log(JSON.stringify(state, null, 2));

				//bar.tick(state.size.transferred);

			});
		});
		*/
	}

	return q.promise;
};

Utils.preprocessOptions = function preprocessOptions(options) {
	var result = {};

	result.appDirectory = options.appDirectory;
	result.targetPath = options.targetPath || null;
	result.template = options.template || 'blank';
	result.packageName = options.packageName || null;
	// result.appName = options.appName || '';

	if (!options.appName) {
		var appNameSplit = options.appDirectory.split('/');
		appNameSplit = appNameSplit[appNameSplit.length - 1].split('\\');
		options.appName = appNameSplit[appNameSplit.length - 1];
	}
	else {
		result.appName = options.appName;
	}

	return result;
};

Utils.preprocessCliOptions = function preprocessCliOptions(argv) {
	try {
		var options = {};

		//	  0	 1
		//cloudbridge start facebooker
		//Grab the app's relative directory name
		options.appDirectory = argv._[1];

		// Grab the name of the app from -a or  --app. Defaults to appDirectory if none provided
		options.appName = argv.appname || argv['app-name'] || argv.a;
		if (!options.appName) {
			var appNameSplit = options.appDirectory.split('/');
			appNameSplit = appNameSplit[appNameSplit.length - 1].split('\\');
			options.appName = appNameSplit[appNameSplit.length - 1];
		}

		// get a package name, like com.cloudbridge.myapp
		options.packageName = argv.id || argv.i;

		if (!options.packageName) {
			var appname = options.appName.replace(/[\W_]/igm, '').toLowerCase(),
				username = usernameSync().toLowerCase();

			options.packageName = 'com.' + username + '.' + appname;
		}

		// start project template can come from cmd line args -t, --template, or the 3rd arg, and defaults to base
		options.template = (argv.template || argv.t || argv._[2] || 'base');

		// figure out the full path
		options.targetPath = Utils.getProjectDirectory(options);

		return options;
	}
	catch (ex) {
		logging.logger.debug('An error occrured processing the CLI arguments', ex);
		Utils.fail('There was an error parsing out options from the Command Line');
	}
};

Utils.getProjectDirectory = function getProjectDirectory(options) {
	return path.resolve(options.appDirectory);
};

Utils.fail = function fail(msg, taskHelp) {
	try {
		logging.logger.debug('Utils.fail', msg, taskHelp);
		logging.logger.debug('Utils.fail stack', msg.stack);

		//If an error handler is set, use it. Otherwise, just print basic info.
		if (Utils.errorHandler) {
			logging.logger.debug('Utils.errorHandler is set, calling that now');
			return Utils.errorHandler(msg, taskHelp);
		}

		logging.logger.error('An error occurred in CloudBridge App Lib and no error handler was set.');
		logging.logger.error(msg);
		process.exit(1);
		return '';
	}
	catch (ex) {
		logging.logger.debug('Utils.fail: ', ex);
	}
};

Utils.gulpInstalledGlobally = function gulpInstalledGlobally() {
	var result = shelljs.exec('gulp -v', { silent: true });

	if (result.code !== 0) {
		return false;
	}

	return true;
};

Utils.copyTemplate = function copyTemplate(origin, to, data, extensions) {
	var files = fs.readdirSync(origin);

	extensions = extensions || /\.(prw|js|ts|coffe|css|less|scss|html|md|json|xml|java)/;

	for (var i = 0; i < files.length; i++) {
		var current = path.join(origin, files[i]);
		var target = path.join(to, files[i]);
		var stat = fs.statSync(current);

		if (stat.isDirectory()) {
			shelljs.mkdir('-p', target);

			Utils.copyTemplate(current, target, data, extensions);
		}
		else {
			var ext = path.extname(current);
			var content = fs.readFileSync(current);

			if ((ext === '') || (ext.match(extensions))) {
				try {
					var parsed = ejs.render(content.toString(), data);
					content = parsed;
				}
				catch (error) {
					console.error("Eror on parsing '" + target + "'", error);
				}
			}

			fs.writeFileSync(target, content);

			/*
			fs.writeFile(target, content, function(err) {
				if (err) {
					console.error(err);
				}
			});
			*/
		}
	}
};
