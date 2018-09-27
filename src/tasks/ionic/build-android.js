'use strict';

let path = require('path'),
	BuildTask = require('./build'),
	Q = require('q'),
	fileUtils = cb_require('utils/file'),
	shelljs = require('shelljs'),
	cordova = cb_require('utils/cordova'),
	ionic = cb_require('utils/ionic'),
	semver = require('semver'),
	AdvplCompileTask = require('../default/advpl-compile');

let BOWER_KEY = path.join('build', 'bower'),
	ANDROID_SRC,
	RPO_SRC,
	WEB_SRC;

class BuildAndroidTask extends BuildTask {

	constructor(options) {
		super(options);

		ANDROID_SRC = path.join(this.projectDir, "platforms", "android");
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

		if (fileUtils.platformChanged(this.projectDir, 'android'))
			return true;

		return false;
	}

	/**
	 * Limpa o projeto para "rebuild"
	 */
	clean() {
		var androidKitDir = path.join(this.projectDir, "platforms", "android"),
			androidBuildDir = path.join(androidKitDir, "build");

		shelljs.rm('-rf', androidBuildDir);

		fileUtils.saveModifiedTime(this.projectDir, ANDROID_SRC, {});
		fileUtils.saveModifiedTime(this.projectDir, WEB_SRC, {});
		fileUtils.saveModifiedTime(this.projectDir, RPO_SRC, {});
		fileUtils.saveModifiedTime(this.projectDir, BOWER_KEY, {});
		return Q();
	}

	/**
	 * Deixa tudo nas pastas corretas para realizar o build
	 */
	prepare() {
		var targetDir,
			version = cordova.findCordovaAndroidVersion(this.projectDir);

		if (semver.gte(version, '7.0.0'))
			targetDir = path.join("platforms", "android", 'app', 'src', 'main', 'assets');
		else
			targetDir = path.join("platforms", "android", 'assets');

		shelljs.cp("-f", path.join(this.projectDir, "src", "apo", "tttp110.rpo"), targetDir);

		targetDir = path.join(this.projectDir, "www");

		// copiar os arquivos em src para www
		shelljs.cp("-r", path.join(this.projectDir, "src", "js"), targetDir);
		shelljs.cp("-r", path.join(this.projectDir, "src", "css"), targetDir);
		shelljs.cp("-r", path.join(this.projectDir, "src", "img"), targetDir);

		fileUtils.savePlatformVersion(this.projectDir, 'android');


		return true;
	}

	/**
	 * Deixa o cordova realizar o build do projeto
	 */
	build() {
		if (!process.env._JAVA_OPTIONS) {
			process.env['_JAVA_OPTIONS'] = '-Xmx512m';
		}

		return ionic.cordova.build('android');
	}

	/**
	 * Se necessário fazer algo após o build, no caso apenas mostra uma mensagem
	 */
	finish() {
		var project = this.project.data();

		console.log("\x1b[32mProjeto " + project.name + " compilado com sucesso\x1b[0m");
		console.log("Utilize o comando Run para realizar o deploy para o device (cb run android)");
	}

}

module.exports = BuildAndroidTask;
