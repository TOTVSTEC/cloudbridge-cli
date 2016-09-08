'use strict';

var AppServer = module.exports,
	Q = require('q'),
	path = require('path'),
	os = require('os'),
	fs = require('fs'),
	spawn = require('child_process').spawn;

AppServer.tcpPort = 0;
AppServer.httpPort = 0;
AppServer.path = '';
AppServer.proc = null;

AppServer.start = function start(projectDir) {
	AppServer.path = path.join(projectDir, 'build', 'windows', 'bin', 'appserver');
	AppServer.tcpPort = 0;
	AppServer.httpPort = 0;

	var cli = path.join(AppServer.path, 'appserver.exe'),
		deferred = Q.defer();

	if (cli === null) {
		deferred.reject(new Error("Não foi possivel encontrar o appserver! Verifique se ele foi instalado!"));
	}
	else {
		this.proc = spawn(cli, ['-console'], {
			cwd: AppServer.path,
			stdio: ['ignore', 'pipe', 'pipe']
		});

		this.proc.stdout.on('data', function(data) {
			var out = data.toString('ascii');

			if (out.trim()) {
				console.log(out);
			}

			if (AppServer.tcpPort === 0) {
				AppServer.readPorts(out);
			}

			if (AppServer.tcpPort !== 0) {
				//console.log('AppServer.tcpPort', AppServer.tcpPort);
				//console.log('AppServer.httpPort', AppServer.httpPort);

				deferred.resolve();
			}
		});

		this.proc.stderr.on('data', function(data) {
			var err = data.toString('ascii');

			if (err.trim()) {
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
	}

	this.proc = null;
	this.path = '';
	this.tcpPort = 0;
	this.httpPort = 0;
};

AppServer.TCP_STARTED = 'Application Server started on port ';
AppServer.HTTP_STARTED = 'HTTP Server started on port ';

AppServer.readPorts = function readPorts(output) {
	var pos = output.indexOf(AppServer.TCP_STARTED);
	var end = null;

	if (pos > -1) {
		pos += AppServer.TCP_STARTED.length;
		end = output.indexOf('.', pos);

		AppServer.tcpPort = Number(output.substring(pos, end));
	}

	var pos = output.indexOf(AppServer.HTTP_STARTED);
	var end = null;

	if (pos > -1) {
		pos += AppServer.HTTP_STARTED.length;
		end = output.indexOf('.', pos);

		AppServer.httpPort = Number(output.substring(pos, end));
		AppServer.updateHttpIni();
	}
};

AppServer.updateHttpIni = function updateHttpIni() {
	var ini = path.join(AppServer.path, 'appserver.ini'),
		ips = os.networkInterfaces(),
		content = null;

	content = fs.readFileSync(ini, {encoding: 'utf8'});
	content = content.replace(/\[[\w\.]+:\d+\/bower\]\r?\nPATH=.+\r?\n/igm, '').trim();

	content += os.EOL;
	content += AppServer.buildBowerMapping('LOCALHOST');

	Object.keys(ips).forEach(function(key, index) {
		var interf = ips[key];

		for (var i = 0; i < interf.length; i++) {
			var element = interf[i];

			if (element.family === 'IPv4') {
				content += AppServer.buildBowerMapping(element.address);
			}
		}
	});


	//content = content.replace(/(\[[\w\.]+:)(?:\d+)(\/\w+\])/igm, '$1' + AppServer.httpPort + '$2');

	fs.writeFileSync(ini, content);
};

AppServer.buildBowerMapping = function buildBowerMapping(ip) {
	var content = os.EOL;
	content += '[' + ip + ':' + this.httpPort + '/bower]' + os.EOL;
	content += 'PATH=./../../../../build/bower' + os.EOL;

	return content;
};

