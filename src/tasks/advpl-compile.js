'use strict';

let AppTask = cb_require('tasks/app-task'),
	fileUtils = cb_require('utils/file'),
	pathUtils = cb_require('utils/paths'),
	path = require('path'),
	Q = require('q'),
	AppServer = require('totvs-platform-helper/appserver'),
	DevStudio = require('totvs-platform-helper/tdscli');

let ADVPL_SRC,
	ADVPL_INCLUDES,
	ADVPL_SRC_RELATIVE;

class AdvplCompileTask extends AppTask {

	constructor(options) {
		super(options);

		ADVPL_SRC_RELATIVE = pathUtils.get('ADVPL_SRC');
		ADVPL_SRC = pathUtils.get('ADVPL_SRC', this.projectDir);
		ADVPL_INCLUDES = pathUtils.get('ADVPL_INCLUDES', this.projectDir);

		this.tdsOptions = {
			serverType: "Logix",
			server: "127.0.0.1",
			build: "7.00.150715P",
			port: 5056,
			environment: "ENVIRONMENT"
		};
	}

	run(cloudbridge, argv) {
		let currentFiles = fileUtils.readModifiedTime(ADVPL_SRC),
			previousFiles = fileUtils.loadModifiedTime(this.projectDir, ADVPL_SRC_RELATIVE),
			result = fileUtils.diff(previousFiles, currentFiles),
			compileFiles = result.modified.concat(result.added),
			removeFiles = result.removed;

		if ((compileFiles.length === 0) &&
			(removeFiles.length === 0)) {
			console.log("Nothing to compile.");
			return Q();
		}

		var tds = new DevStudio(),
			appserver = new AppServer({
				target: pathUtils.get("APPSERVER", this.projectDir)
			});

		return appserver.start()
			.then(() => {
				this.tdsOptions.port = appserver.tcpPort;
				this.tdsOptions.build = appserver.build;
			})
			.then(() => {
				if (removeFiles.length > 0) {
					let options = Object.assign({}, this.tdsOptions, {
						program: removeFiles.map(f => path.join(ADVPL_SRC, f)),
						authorization: ''
					});

					//console.log("REMOVING FILES: " + JSON.stringify(removeFiles, null, 2));

					return tds.remove(options);
				}
			})
			.then(() => {
				if (compileFiles.length > 0) {
					let options = Object.assign({}, this.tdsOptions, {
						recompile: true,
						program: compileFiles.map(f => path.join(ADVPL_SRC, f)),
						includes: [
							ADVPL_SRC,
							ADVPL_INCLUDES
						]
					});

					//console.log("COMPILING FILES: " + JSON.stringify(compileFiles, null, 2));

					return tds.compile(options);
				}
			})
			.then(() => {
				this.saveBuildInfo(currentFiles);

				return appserver.stop();
			});
	}

	saveBuildInfo(files) {
		fileUtils.saveModifiedTime(this.projectDir, ADVPL_SRC_RELATIVE, files);
	}

}

module.exports = AdvplCompileTask;
