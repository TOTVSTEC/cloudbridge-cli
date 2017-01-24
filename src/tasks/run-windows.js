'use strict';

var AppTask = cb_require('tasks/run'),
	os = require('os'),
	path = require('path'),
	exec = require('child_process').exec,
	utils = cb_require('utils/utils');

const SmartClient = require('totvs-platform-helper/smartclient');
const AppServer = require('totvs-platform-helper/appserver');

const APPSERVER_DIR = path.join('build', 'windows', 'bin', 'appserver'),
	APPSERVER_EXE = os.platform() === 'win32' ? 'appserver.exe' : 'appserver',
	SMARTCLIENT_DIR = path.join('build', 'windows', 'bin', 'smartclient'),
	SMARTCLIENT_EXE = os.platform() === 'win32' ? 'smartclient.exe' : 'smartclient';

class RunWindowsTask extends AppTask {

	run(cloudbridge, argv) {
		var _this = this,
			appserver = new AppServer({
				target: path.join(this.projectDir, APPSERVER_DIR, APPSERVER_EXE)
			}),
			smartclient = new SmartClient({
				target: path.join(this.projectDir, SMARTCLIENT_DIR, SMARTCLIENT_EXE)
			}),
			program = this.project.get('name') + '.Cloud';

		console.log(argv);

		return appserver.start()
			.then(function() {
				var args = [];

				var port = argv.d || argv.debug;

				if (port) {
					port = (typeof port === 'number') ? port : 65000;

					args.push('--remote-debugging-port=' + port);

					setTimeout(function() {
						_this.openDevTools(port);
					}, 2500);
				}

				return smartclient.run({
					program: program,
					communication: {
						address: "localhost",
						port: appserver.tcpPort
					}
				}, args);
			})
			.then(function() {
				return appserver.stop();
			});
	}

	openDevTools(port) {
		var command = 'start chrome --app="http://localhost:' + port + '"';

		exec(command, function(error, stdout, stderr) {
			if (error) {
				console.error('exec error: ' + error + '\n');
				console.error(stderr);

				return;
			}

			if (stdout)
				console.log('stdout: ' + stdout + '\n');
		});

	}

	/*
	var portrange = 45032;
	function getFreePort(cb) {
		var port = portrange;
		portrange += 1;

		var server = net.createServer();
		server.listen(port, function(err) {
			server.once('close', function() {
				cb(port);
			});
			server.close();
		});
		server.on('error', function(err) {
			getFreePort(cb);
		});
	}
	*/

}

module.exports = RunWindowsTask;
