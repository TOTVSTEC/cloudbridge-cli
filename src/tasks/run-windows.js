'use strict';

var AppTask = cb_require('tasks/run'),
	paths = cb_require('utils/paths'),
	exec = require('child_process').exec;

const SmartClient = require('totvs-platform-helper/smartclient');
const AppServer = require('totvs-platform-helper/appserver');

class RunWindowsTask extends AppTask {

	run(cloudbridge, argv) {
		var appserver = new AppServer({
			target: paths.get("APPSERVER", this.projectDir)
		}),
			smartclient = new SmartClient({
				target: paths.get("SMARTCLIENT", this.projectDir)
			}),
			program = this.project.get('name') + '.Cloud',
			debugPort = (argv.d || argv.debug || false);

		if (debugPort) {
			debugPort = (typeof debugPort === 'number') ? debugPort : 65000;
		}

		return this.build(argv)
			.then(() => {
				return appserver.start();
			})
			.then(() => {
				var args = [];

				if (debugPort) {
					args.push('--remote-debugging-port=' + debugPort);

					process.nextTick(() => {
						this.openDevTools(debugPort);
					});
				}

				return smartclient.run({
					program: program,
					communication: {
						address: "localhost",
						port: appserver.tcpPort
					}
				}, args);
			})
			.then(() => {
				return appserver.stop();
			});
	}

	build(argv) {
		let BuildWindowsTask = require('./build-windows'),
			task = new BuildWindowsTask();

		return task.run(cli, argv);
	}

	openDevTools(port) {
		var command = 'start chrome --app="http://localhost:' + port + '"';

		exec(command, (error, stdout, stderr) => {
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
