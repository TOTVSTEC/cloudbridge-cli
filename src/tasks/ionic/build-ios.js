'use strict';

let path = require('path'),
	BuildTask = require('./build'),
	Q = require('q'),
	fileUtils = cb_require('utils/file'),
	shelljs = require('shelljs'),
	AdvplCompileTask = require('../default/advpl-compile');

let BOWER_KEY = path.join('build', 'bower'),
	IOS_SRC,
	RPO_SRC,
	WEB_SRC;

class BuildIOSTask extends BuildTask {

	constructor(options) {
		super(options);

		IOS_SRC = path.join(this.projectDir, "platforms", "ios");
		RPO_SRC = path.join(this.projectDir, "src", "apo");
		WEB_SRC = path.join(this.projectDir, "www");
	}

	run(cloudbridge, argv) {
		let forceClean = this.needClean(argv),
			task,
			promise,
			noADVPL = false;
		try {
			task = new AdvplCompileTask(this.options);
		}
		catch (err) {
			noADVPL = true;
			console.warn("\x1b[33mNao e possivel compilar fontes ADVPL sem uma plataforma de SO compativel (Windows/Mac)\nSe for necessario compilar programas ADVPL, favor adicionar a plataforma correspondente ao seu sistema (platform add windows/mac)\nIsso é apenas um aviso, os outros arquivos (JS, native) serao compilados normalmente.\x1b[0m");
			promise = Q();
		}
		if (!noADVPL) {
			promise = task.run(cloudbridge, argv);
		}
		return promise
			.then(() => {
				if (forceClean)
					return this.clean();
			})
			.then(() => {
				return this.prepare();
			})
			.then((modified) => {
				if (!modified)
					return;

				if (argv._[0] == "run")
					return;

				return this.build()
					.then(() => {
						return this.finish();
					});
			});
	}

	needClean(argv) {
		if (argv.clean || argv.c)
			return true;

		if (fileUtils.platformChanged(this.projectDir, 'ios'))
			return true;

		return false;
	}

	clean() { // limpa o projeto para "rebuild"
		var iosKitDir = path.join(this.projectDir, "platforms", "ios"),
			iosBuildDir = path.join(iosKitDir, "build");

		shelljs.rm('-rf', iosBuildDir);

		fileUtils.saveModifiedTime(this.projectDir, IOS_SRC, {});
		fileUtils.saveModifiedTime(this.projectDir, WEB_SRC, {});
		fileUtils.saveModifiedTime(this.projectDir, RPO_SRC, {});
		fileUtils.saveModifiedTime(this.projectDir, BOWER_KEY, {});
		return Q();
	}

	prepare() { // deixa tudo nas pastas corretas para realizar o build
		var project = require(path.join(this.projectDir, 'package.json'));
		var displayName = project.displayName || "MyApp";
		shelljs.cp("-f", path.join(this.projectDir, "src", "apo", "tttp110.rpo"), path.join("platforms", "ios", displayName));
		fileUtils.savePlatformVersion(this.projectDir, 'ios');

		// copiar os arquivos em src para www
		shelljs.cp("-r", path.join(this.projectDir, "src", "js"), path.join(this.projectDir, "www"))
		shelljs.cp("-r", path.join(this.projectDir, "src", "css"), path.join(this.projectDir, "www"))
		shelljs.cp("-r", path.join(this.projectDir, "src", "img"), path.join(this.projectDir, "www"))

		// Tema do THF
		if (shelljs.exec("npm install --save @totvs/mobile-theme").code !== 0) {
			throw new Error("Make sure ionic and cordova are installed (npm install -g cordova ionic).");
		}

		return true;
	}

	build() { // deixa o cordova realizar o build do projeto
		var retCode = shelljs.exec("ionic cordova build ios --device").code;
		if (retCode != 0) {
			throw new Error("Error building Cloudbridge ionic-like project");
		}
		return Q();
	}

	finish() { // Se necessário fazer algo após o build, no caso apenas mostra uma mensagem
		var project = this.project.data();
		console.log("\x1b[32mProjeto " + project.name + " compilado com sucesso\x1b[0m");
		console.log("Utilize o comando Run para realizar o deploy para o device (cb run ios)");
	}

}

module.exports = BuildIOSTask;
