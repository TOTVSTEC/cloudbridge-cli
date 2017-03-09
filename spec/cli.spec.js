'use strict';

process.env.NODE_ENV = 'test';

require('../globals');

let os = require('os'),
	path = require('path'),
	shelljs = require('shelljs'),
	projectName = 'MyApp',
	tempDir = path.join(os.tmpdir(), 'cloudbridge'),
	projectDir = path.join(tempDir, projectName),
	//spawn = cb_require('utils/spawn'),
	cloudbridge = cb_require('cli'),
	generalOptions = {
		cwd: tempDir
	},
	projectOptions = {
		cwd: projectDir
	};



shelljs.rm('-rf', tempDir);
shelljs.mkdir('-p', tempDir);
console.log('TempDir: ' + tempDir);

jasmine.DEFAULT_TIMEOUT_INTERVAL = 200000;
jasmine.getEnv().defaultTimeoutInterval = 200000;

let platforms = [];
if (process.platform === 'win32') {
	platforms = ['windows', 'android'];
}
else if (process.platform === 'linux') {
	platforms = ['linux', 'android'];
}
else if (process.platform === 'darwin') {
	platforms = ['osx', 'ios', 'android'];
}

//var assert = require('assert');

function run(args, options, done, silent) {
	let runArgs = ['node.exe', path.join(__basedir, 'index.js')].concat(args);

	if (!silent)
		console.log('\ncloudbridge ' + args.join(' '));

	let promise = cloudbridge.run(runArgs, options.cwd);

	if (done)
		promise
			.then(() => {
				if (!silent)
					console.log('Sucess!');

				done();
			})
			.catch((error) => {
				if (!silent)
					console.error('Failed!');

				done.fail(error);
			});

	return promise;
}

function downloadAndroid() {
	console.log('downloadAndroid');
}

describe('cloudbridge', function() {

	beforeAll(function() {
		downloadAndroid();
	});

	describe('#cache', function() {

		it('should list cached packages', function(done) {
			let args = ['cache', 'list'];

			run(args, generalOptions, done);
		});

		xit('should clean cached packages', function(done) {
			let args = ['cache', 'clean'];

			run(args, generalOptions, done);
		});
	});

	describe('#start', function() {

		beforeEach(() => {
			shelljs.rm('-rf', projectDir);
		});

		it('should start a new project with default template', function(done) {
			let args = ['start', projectName];

			run(args, generalOptions, done);
		});

		it('should start a new project with base template', function(done) {
			let args = ['start', projectName, 'base'];

			run(args, generalOptions, done);
		});

		it('should start a new project with showcase template', function(done) {
			let args = ['start', projectName, 'showcase'];

			run(args, generalOptions, done);
		});
	});

	describe('#platform', function() {
		platforms.forEach((platform, index) => {
			it('should add ' + platform + ' platform', function(done) {
				let args = ['platform', 'add', platform];

				run(args, projectOptions, done);
			});

			it('should remove ' + platform + ' platform', function(done) {
				let args = ['platform', 'remove', platform];

				run(args, projectOptions, done);
			});
		});


		it('should add all avaliable platforms (' + platforms.join(', ') + ')', function(done) {
			let args = ['platform', 'add'].concat(platforms);

			shelljs.rm('-rf', projectDir);

			run(['start', projectName, 'showcase'], generalOptions, null, true)
				.then(() => {
					return run(args, projectOptions, done);
				})
				.catch((error) => done.fail(error));
		});

	});

	describe('#build', function() {

		platforms.forEach((platform, index) => {
			it('should build ' + platform + ' platform', function(done) {
				let args = ['build', platform];

				run(args, projectOptions, done);
			});
		});

	});

});


