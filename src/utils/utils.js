'use strict';

var fs = require('fs'),
	colors = require('colors'),
	archiver = require('archiver'),
	ConfigJson = cb_require('project/config-json'),
	Multibar = cb_require('ui/multibar'),
	path = require('path'),
	Q = require('q'),
	shelljs = require('shelljs'),
	logging = require('./logging'),
	ejs = require('ejs');

var Utils = module.exports;

// Utils.useMultiBar = true;

Utils.errorHandler = null;

Utils.transformCookies = function transformCookies(jar) {
	if (!jar) {
		throw new Error('You parse out cookies if they are null');
	}
	return jar.map(function(c) {
		return c.key + "=" + encodeURIComponent(c.value);
	}).join("; ");
};

Utils.retrieveCsrfToken = function retrieveCsrfToken(jar) {
	if (!jar || typeof jar == 'undefined' || jar.length === 0) {
		return '';
	}
	var csrftoken = '';
	for (var i = 0; i < jar.length; i++) {
		if (jar[i].key == 'csrftoken') {
			csrftoken = jar[i].value;
			break;
		}
	}
	return csrftoken;
};

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

	zip.on('close', function() {
		q.resolve(zipDestination);
	});

	return q.promise;
};


Utils.fetchPackage = function fetchPackage(options) {
	if (typeof options == 'string') {
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

	return Utils.fetchArchive(packageDir, url).then(function() {
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
	var os = require('os');
	var fs = require('fs');
	var path = require('path');
	var unzip = require('unzip');
	var q = Q.defer();

	// The folder name the project will be downloaded and extracted to
	var message = ['Downloading:'.bold, archiveUrl].join(' ');
	logging.logger.info(message);

	var tmpFolder = os.tmpdir();
	var tempZipFilePath = path.join(tmpFolder, 'cloudbridge-' + new Date().getTime() + '.zip');

	var unzipRepo = function unzipRepo(fileName) {
		var readStream = fs.createReadStream(fileName);
		readStream.on('error', function(err) {
			logging.logger.debug(('unzipRepo readStream: ' + err).error);
			q.reject(err);
		});

		var writeStream = unzip.Extract({ path: targetPath });
		writeStream.on('close', function() {
			q.resolve();
		});
		writeStream.on('error', function(err) {
			logging.logger.debug(('unzipRepo writeStream: ' + err).error);
			q.reject(err);
		});
		readStream.pipe(writeStream);
	};

	var proxy = process.env.PROXY || process.env.http_proxy || null;
	var request = require('request');
	request({ url: archiveUrl, rejectUnauthorized: false, encoding: null, proxy: proxy }, function(err, res, body) {
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
	}).on('response', function(res) {
		// Add default flag for CLI - have it attach multibar and upgrade its progress for simultaneous downloading bars (crosswalk).
		if (!isGui) {
			var bar = Multibar.newBar('[:bar]  :percent  :etas', {
				complete: '=',
				incomplete: ' ',
				width: 30,
				total: parseInt(res.headers['content-length'], 10)
			});

			res.on('data', function(chunk) {
				try {
					bar.tick(chunk.length);
				}
				catch (e) { }
			});
		}
	});

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
				username = require('username').sync().toLowerCase();

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

/*
Utils.mergeOptions = function mergeOptions(obj1, obj2) {
	var obj3 = {};

	for (var attrname in obj1) {
		obj3[attrname] = obj1[attrname];
	}
	for (var attrname in obj2) {
		obj3[attrname] = obj2[attrname];
	}

	return obj3;
};
*/

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
