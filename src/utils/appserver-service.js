'use strict';

var AppServer = module.exports,
	Q = require('q'),
	path = require('path'),
	fs = require('fs'),
	cp = require('child_process'),
	spawn = cp.spawn,
	execFile = cp.execFile,
	ini = require('ini'),
	elevate = require('node-windows').elevate;

AppServer.getStatus = function getStatus(projectDir) {
	var project = require(path.join(projectDir, 'cloudbridge.json')),
		command  = 'wmic service where (name="CloudBridge-' + project.name + '") get state /value',
		deferred = Q.defer();

	cp.exec(command, function(error, stdout, stderr) {
		console.log(stdout);
		console.error(stderr);

		if (error) {
			deferred.reject(error);
		}
		else {
			stdout = stdout.trim().toLowerCase();

			var pos = stdout.indexOf('state='),
				installed = (pos > -1),
				running = false;

			if (installed) {
				stdout.substring(pos) == 'running';
			}

			deferred.resolve({
				installed: installed,
				running: running
			});
		}
	});

	return deferred.promise;
};

AppServer.start = function start(projectDir) {
	var deferred = Q.defer(),
		home = path.join(projectDir, 'build', 'windows', 'bin', 'appserver'),
		config = ini.parse(fs.readFileSync(path.join(home, 'appserver.ini'), 'utf-8')),
		command = 'net start ' + config.SERVICE.NAME;

	var exit = elevate(command, {cwd: home}, function(error, stdout, stderr) {
		console.log(stdout);
		console.error(stderr);

		if (error) {
			deferred.reject(error);
		}
		else {
			deferred.resolve();
		}
	});

	return deferred.promise;
};

AppServer.install = function install(projectDir, start) {
	var home = path.join(projectDir, 'build', 'windows', 'bin', 'appserver'),
		command  = path.join(home, 'appserver.exe') + ' -install',
		deferred = Q.defer();

	/*if (start) {
		var config = ini.parse(fs.readFileSync(path.join(home, 'appserver.ini'), 'utf-8'));
		command += ' && net start ' + config.SERVICE.NAME;
	}
*/
	var exit = elevate(command, {cwd: home}, function(error, stdout, stderr) {
		console.log(stdout);
		console.error(stderr);

		if (error) {
			deferred.reject(error);
		}
		else {
			deferred.resolve();
		}
	});

	return deferred.promise;
};

/*
AppServer.start = function start(projectDir) {
	var home = path.join(projectDir, 'build', 'windows', 'bin', 'appserver'),
		cli  = path.join(home, 'appserver.exe'),
		deferred = Q.defer();

	if (cli === null) {
		deferred.reject(new Error("Não foi possivel encontrar o appserver! Verifique se ele foi instalado!"));
	}
	else {

		//start "AppServer 7.00.150715P" "exe" 'console'
		//this.proc = spawn('cmd', ['/c', 'start', 'AppServer', cli, '-console'], {cwd: home, detached: true , stdio: ['ignore', 1, 2]});
		this.proc = spawn('cmd', ['/c', 'start', 'AppServer', cli, '-console'], {cwd: home, detached: true});
		*/
		/*
		//this.proc = execFile('start', ['AppServer', cli, '-console'], {cwd: home, stdio: ['ignore', 1, 2]}, function(error, stdout, stderr) {
		//this.proc = execFile(cli, ['-console'], {cwd: home, stdio: ['ignore', 1, 2]}, function(error, stdout, stderr) {
			if (error) {
				deferred.reject(error);

				throw error;
			}

			deferred.resolve();

			console.log(stdout);
			console.error(stderr);
		});
		*/

		//var proc = spawn(cli, ['-console'], {cwd: home, detached: true, stdio: ['ignore', 1, 2]});
		//this.proc.unref();

/*
		this.proc.stdout.on('data', function(data) {
			console.log("proc.stdout.on('data')");

			var out = data.toString('ascii').trim();

			if (out) {
				console.log(out);
			}

			if (out.indexOf('Application Server started on port') > -1) {
				deferred.resolve();
			}
		});

		this.proc.stderr.on('data', function(data) {
			console.log("proc.stderr.on('data')");

			var err = data.toString('ascii').trim();

			if (err) {
				console.error(err);
			}
		});

		this.proc.on('close', function(code) {
			console.log("proc.on('close')");

			if (code !== 0) {
				deferred.reject(new Error("AppServer process exited with code " + code));
			}
			else {
				deferred.resolve();
			}
		});

		this.proc.on('exit', function(code) {
			console.log("proc.on('exit')");
			if (code !== 0) {
				deferred.reject(new Error("AppServer process exited with code " + code));
			}
			else {
				deferred.resolve();
			}
		});

		this.proc.on('error', function(err) {
			console.log("proc.on('error')");
			deferred.reject(err);
		});
	}

	return deferred.promise;
};
*/

AppServer.stop = function stop(projectDir) {
	this.proc.kill();
};
