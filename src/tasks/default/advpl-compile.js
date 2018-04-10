'use strict';

let AppTask = require('./app-task'),
	fileUtils = cb_require('utils/file'),
	pathUtils = cb_require('utils/paths'),
	path = require('path'),
	Q = require('q'),
	AppServer = require('totvs-platform-helper/appserver'),
	TDS = require('totvs-platform-helper/tdscli');

let ADVPL_SRC,
	ADVPL_INCLUDES,
	ADVPL_SRC_RELATIVE,
	tds_appre_bkp,
	iret;

class AdvplCompileTask extends AppTask {

	constructor(options) {
		super(options);

		ADVPL_SRC_RELATIVE = pathUtils.get('ADVPL_SRC');
		ADVPL_SRC = pathUtils.get('ADVPL_SRC', this.projectDir);
		ADVPL_INCLUDES = pathUtils.get('ADVPL_INCLUDES', this.projectDir);

		this.tdsOptions = {
			serverType: "Logix",
			server: "127.0.0.1",
			build: "7.00.170117A",
			port: 5056,
			environment: "ENVIRONMENT"
		};

		this.tds = new TDS();

		this.appserver = new AppServer({
			target: pathUtils.get("APPSERVER", this.projectDir)
		});
	}

	run(cloudbridge, argv) {
		let cleanFiles = [];

		if (argv.clean || argv.c) {
			cleanFiles = Object.keys(fileUtils.loadModifiedTime(this.projectDir, ADVPL_SRC_RELATIVE));
			this.saveBuildInfo({});
		}

		let currentFiles = fileUtils.readModifiedTime(ADVPL_SRC),
			previousFiles = fileUtils.loadModifiedTime(this.projectDir, ADVPL_SRC_RELATIVE),
			result = fileUtils.diff(previousFiles, currentFiles),
			compileFiles = result.modified.concat(result.added),
			removeFiles = result.removed;

		if (argv.clean || argv.c) {
			removeFiles = Array.from(new Set(compileFiles.concat(removeFiles).concat(cleanFiles)));
		}

		if ((compileFiles.length === 0) &&
			(removeFiles.length === 0)) {
			//console.log("Nothing to compile.");
			return Q();
		}

		tds_appre_bkp = process.env.TDS_APPRE;
		delete process.env.TDS_APPRE;
		console.log("passou aqui");


		return this.appserver.start()
			.then(() => {
				this.tdsOptions.port = this.appserver.tcpPort;
				this.tdsOptions.build = this.appserver.build;
			})
			.then(() => {

				if (removeFiles.length > 0) {
					let deferred = Q.defer();
					this.remove(removeFiles)
						.then(() => {
							deferred.resolve();
						})
						.catch((err) => {
							deferred.resolve();
						});
					return deferred.promise;
				}
			})
			.then(() => {
				if (compileFiles.length > 0)
					return this.compile(compileFiles);
			})
			.then(() => {
				this.saveBuildInfo(currentFiles);
				process.env.TDS_APPRE = tds_appre_bkp;
				return this.appserver.stop();
			})
			.catch((err) => {
				process.env.TDS_APPRE = tds_appre_bkp;
				this.appserver.stop();
				var err = new Error("Failed do compile ADVPL");
				throw err;
			});
	}

	remove(files) {
		let options = Object.assign({}, this.tdsOptions, {
			program: files.map(f => path.join(ADVPL_SRC, f)),
			authorization: ''
		});

		//console.log("REMOVING FILES: " + JSON.stringify(removeFiles, null, 2));

		return this.tds.remove(options);
	}

	compile(files) {
		if (files.length > 0) {
			let options = Object.assign({}, this.tdsOptions, {
				recompile: true,
				program: files.map(f => path.join(ADVPL_SRC, f)),
				includes: [
					ADVPL_SRC,
					ADVPL_INCLUDES
				]
			});

			//console.log("COMPILING FILES: " + JSON.stringify(compileFiles, null, 2));
			return this.tds.compile(options);
		}
	}

	saveBuildInfo(files) {
		fileUtils.saveModifiedTime(this.projectDir, ADVPL_SRC_RELATIVE, files);
	}

}

module.exports = AdvplCompileTask;
