'use strict';

var AppTask = cb_require('tasks/run'),
	path = require('path'),
	exec = require('child_process').exec,
	utils = cb_require('utils/utils');

const SmartClient = require('totvs-platform-helper/smartclient');
const AppServer = require('totvs-platform-helper/appserver');

const APPSERVER_DIR = path.join('build', 'windows', 'bin', 'appserver');
const SMARTCLIENT_DIR = path.join('build', 'windows', 'bin', 'smartclient');

class RunWindowsTask extends AppTask {

	run(cloudbridge, argv) {
		var _this = this,
			appserver = new AppServer(path.join(this.projectDir, APPSERVER_DIR)),
			smartclient = new SmartClient(path.join(this.projectDir, SMARTCLIENT_DIR)),
			program = this.project.get('name') + '.Cloud';

		//49152 to 65535

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
