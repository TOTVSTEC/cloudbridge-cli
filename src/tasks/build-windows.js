'use strict';

let AppTask = cb_require('tasks/app-task'),
	path = require('path'),
	utils = cb_require('utils/utils'),
	AppServer = require('totvs-platform-helper/appserver'),
	DevStudio = require('totvs-platform-helper/tdscli');

const APPSERVER_DIR = path.join('build', 'windows', 'bin', 'appserver'),
	APPSERVER_EXE = 'appserver.exe';

class BuildWindowsTask extends AppTask {

	run(cloudbridge, argv) {
		var projectDir = this.projectDir,
			tdsOptions = {
				serverType: "Logix",
				server: "127.0.0.1",
				build: "7.00.150715P",
				port: 5056,
				//user: "admin",
				//psw: "",
				recompile: true,
				environment: "ENVIRONMENT",
				program: [
					path.join(projectDir, 'src', 'advpl')
				],
				includes: [
					path.join(projectDir, 'src', 'advpl'),
					path.join(projectDir, 'build', 'advpl', 'includes')
				]
			};

		var appserver = new AppServer({
				target: path.join(projectDir, APPSERVER_DIR, APPSERVER_EXE)
			}),
			tds = new DevStudio();

		return appserver.start()
			.then(function() {
				tdsOptions.port = appserver.tcpPort;
				tdsOptions.build = appserver.build;

				return tds.compile(tdsOptions);
			})
			.then(function() {
				return appserver.stop();
			});
	}
}

module.exports = BuildWindowsTask;
