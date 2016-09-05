'use strict';

var AppServer = module.exports,
	Q = require('q'),
	path = require('path'),
	spawn = require('child_process').spawn;

AppServer.start = function start(projectDir) {
	var home = path.join(projectDir, 'build', 'windows', 'bin', 'appserver'),
		cli  = path.join(home, 'appserver.exe'),
		deferred = Q.defer();

	if (cli === null) {
		deferred.reject(new Error("Não foi possivel encontrar o appserver! Verifique se ele foi instalado!"));
	}
	else {
		this.proc = spawn(cli, ['-console'], {
			cwd: home,
			stdio: ['ignore', 'pipe', 'pipe']
		});

		this.proc.stdout.on('data', function(data) {
			var out = data.toString('ascii').trim();

			if (out) {
				console.log(out);
			}

			var pos = out.indexOf('Application Server started on port');

			if (pos > -1) {
				var end = out.indexOf('\n', pos);
				this.tcpPort = out.substr(pos, end);

				deferred.resolve();
			}
		});

		this.proc.stderr.on('data', function(data) {
			var err = data.toString('ascii').trim();

			if (err) {
				console.error(err);
			}
		});

		this.proc.on('close', function(code) {
			if (code !== 0) {
				deferred.reject(new Error("AppServer process exited with code " + code));
			}
			else {
				deferred.resolve();
			}
		});

		this.proc.on('exit', function(code) {
			if (code !== 0) {
				deferred.reject(new Error("AppServer process exited with code " + code));
			}
			else {
				deferred.resolve();
			}
		});

		this.proc.on('error', function(err) {
			deferred.reject(err);
		});
	}

	return deferred.promise;
};

AppServer.stop = function stop(projectDir) {
	if (this.proc) {
		this.proc.kill();
		this.proc = null;
	}
};
