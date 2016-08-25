'use strict';

var SmartClient = module.exports,
	Q = require('q'),
	path = require('path'),
	exec = require('shelljs').exec;


SmartClient.run = function run(projectDir) {
	var home = path.join(projectDir, 'build', 'windows', 'bin', 'smartclient'),
		cli  = path.join(home, 'smartclient.exe'),
		project = cb_require('project/project').load(projectDir).data(),
		deferred = Q.defer();

	if (cli === null) {
		deferred.reject(new Error("Não foi possivel encontrar o smartclient! Verifique se ele foi instalado!"));
	}
	else {
		var cmd = cli + ' ' + ['-Q', '-P=' + project.name +  '.Cloud', '-C=TCP', '-E=ENVIRONMENT'].join(' ');

		//console.log("SMARTCLIENT: " + cmd);

		this.proc = exec(cmd, {
			cwd: home,
			async: true
		});

		this.proc.stdout.on('data', function(data) {
			var out = data.toString('ascii').trim();

			if (out) {
				console.log(out);
			}

			if (out.indexOf('Application Server started on port') > -1) {
				deferred.resolve();
			}
		});

		this.proc.stderr.on('data', function(data) {
			var err = data.toString('ascii').replace(/^Warning: NLS unused message: (.*)$/gm, "").trim();

			if (err) {
				console.error(err);
			}
		});

		this.proc.on('close', function(code) {
			if (code !== 0) {
				deferred.reject(new Error("SmartClient process exited with code " + code));
			}
			else {
				deferred.resolve();
			}
		});

		this.proc.on('exit', function(code) {
			if (code !== 0) {
				deferred.reject(new Error("SmartClient process exited with code " + code));
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

SmartClient.close = function close(projectDir) {
	if (this.proc) {
		this.proc.kill();
		this.proc = null;
	}
};
