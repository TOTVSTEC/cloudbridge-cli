'use strict';

var AppTask = cb_require('tasks/app-task'),
	Package = cb_require('utils/package'),
	Q = require('q'),
	path = require('path'),
	paths = cb_require('utils/paths'),
	shelljs = require('shelljs'),
	AppServer = require('totvs-platform-helper/appserver'),
	DevStudio = require('totvs-platform-helper/tdscli');

class AdvplUpdateTask extends AppTask {

	constructor(options) {
		super(options);

		this.tdsOptions = {
			serverType: "Logix",
			server: "127.0.0.1",
			build: "7.00.150715P",
			port: 5056,
			environment: "ENVIRONMENT",
			//localPatch: 'T',	//true,
			localPatch: 'F',	//TODO: fazer aplicacao de patch local
			applyOldProgram: 'T'	//true
		};
	}

	run(cloudbridge, argv) {
		//var platforms = this.getPlatforms(argv);

		return this.update({});
	}

	update(components) {
		var appserver = new AppServer({
			target: paths.get("APPSERVER", this.projectDir),
			silent: true
		});

		return appserver.start()
			.then(() => {
				this.tdsOptions.port = appserver.tcpPort;
				this.tdsOptions.build = appserver.build;

				return this.updatePackages(components);
			})
			.then(() => {
				return appserver.stop();
			});
	}


	updatePackages(components) {
		var tds = new DevStudio({ silent: true });

		return Object.keys(components).reduce((promise, name, index) => {
			var version = components[name],
				pack = new Package(name, null, version);

			return promise
				.then(() => {
					return pack.fetch();
				})
				.then(() => {
					return pack.update(this.projectDir, this.project.data());
				})
				.then(() => {
					return this.applyPatch(tds, pack);
				})
				.then(() => {
					if (this.options.save)
						return this.save(name, version);
				})
				.then(() => {
					if (!this.options.silent)
						console.log('\nThe advpl component ' + name.bold + ' has been updated to version ' + version.bold + '!');
				});
		}, Q());
	}

	applyPatch(tds, pack) {
		var patchs = shelljs.ls(path.join(pack.src, '**', '*.ptm'));

		return patchs.reduce((promise, patch, index) => {
			return promise
				.then(() => {
					var filename = path.basename(patch),
						target = path.join(this.projectDir, 'build', 'windows', 'data', filename);

					shelljs.cp('-Rf', patch, target);

					var options = Object.assign({}, this.tdsOptions, {
						patchFile: filename
					});

					return tds.applyPatch(options)
						.then(() => {
							shelljs.rm('-rf', target);
						});
				});
		}, Q());
	}

	save(name, version) {
		var components = this.project.get('components') || {};

		components.advpl = components.advpl || {};
		components.advpl[name] = version;

		this.project.set('components', components);
		this.project.save();
	}

}

module.exports = AdvplUpdateTask;

