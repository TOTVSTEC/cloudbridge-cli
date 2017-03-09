'use strict';

process.env.NODE_ENV = 'test';

require('../globals');

let os = require('os'),
	path = require('path'),
	shelljs = require('shelljs'),
	projectName = 'MyApp',
	tempDir = path.join(os.tmpdir(), 'cloudbridge'),
	projectDir = path.join(tempDir, projectName),
	cloudbridge = cb_require('cli');

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

function run(args, cwd, done, silent) {
	let runArgs = ['node.exe', path.join(__basedir, 'index.js')].concat(args);

	if (!silent)
		console.log('\ncloudbridge ' + args.join(' '));

	let promise = cloudbridge.run(runArgs, cwd);

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

describe('cloudbridge', function() {

	beforeAll(function() {
		shelljs.rm('-rf', tempDir);
		shelljs.mkdir('-p', tempDir);

		console.log('TempDir: ' + tempDir);
	});

	afterAll(function() {
		shelljs.rm('-rf', tempDir);
	});

	it('should show the banner and commands', function(done) {
		run([], tempDir, done);
	});

	it('should show the help', function(done) {
		run(['-h'], tempDir, done);
	});

	describe('#cache', function() {

		it('should list cached packages', function(done) {
			let args = ['cache', 'list'];

			run(args, tempDir, done);
		});

		it('should clean cached packages', function(done) {
			let args = ['cache', 'clean'];

			run(args, tempDir, done);
		});
	});

	describe('#start', function() {

		beforeEach(() => {
			shelljs.rm('-rf', projectDir);
		});

		it('should start a new project with default template', function(done) {
			let args = ['start', projectName];

			run(args, tempDir, done);
		});

		it('should start a new project with base template', function(done) {
			let args = ['start', projectName, 'base'];

			run(args, tempDir, done);
		});

		it('should start a new project with showcase template', function(done) {
			let args = ['start', projectName, 'showcase'];

			run(args, tempDir, done);
		});
	});

	describe('#platform', function() {
		platforms.forEach((platform, index) => {
			it('should add ' + platform + ' platform', function(done) {
				let args = ['platform', 'add', platform];

				run(args, projectDir, done);
			});

			it('should remove ' + platform + ' platform', function(done) {
				let args = ['platform', 'remove', platform];

				run(args, projectDir, done);
			});
		});


		it('should add all avaliable platforms (' + platforms.join(', ') + ')', function(done) {
			let args = ['platform', 'add'].concat(platforms);

			shelljs.rm('-rf', projectDir);

			run(['start', projectName, 'showcase'], tempDir, null, true)
				.then(() => {
					return run(args, projectDir, done);
				})
				.catch((error) => done.fail(error));
		});

	});

	xdescribe('#build', function() {

		platforms.forEach((platform, index) => {
			it('should build ' + platform + ' platform', function(done) {
				let args = ['build', platform];

				run(args, projectDir, done);
			});
		});

	});

	xdescribe('#run', function() {

		platforms.forEach((platform, index) => {
			it('should run ' + platform + ' platform', function(done) {
				let args = ['run', platform];

				run(args, projectDir, done);
			});
		});

	});

	describe('#bower', function() {

		it('should add bower component', function(done) {
			let args = ['bower', 'add', 'angular', 'material-design-lite'];

			run(args, projectDir, done);
		});

		it('should remove bower component', function(done) {
			let args = ['bower', 'remove', 'angular', 'material-design-lite'];

			run(args, projectDir, done);
		});

	});

	describe('#restore', function() {

		beforeEach(() => {
			shelljs.rm('-rf', path.join(projectDir, 'build'));
		});

		it('should restore installed packages', function(done) {
			let args = ['restore'];

			run(args, projectDir, done);
		});

	});


	describe('#update', function() {

		it('should check for updates', function(done) {
			let args = ['update'];

			run(args, projectDir, done);
		});

	});

});


