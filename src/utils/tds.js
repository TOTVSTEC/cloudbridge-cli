'use strict';

var TDS = module.exports,
	Q = require('q'),
	_s = require("underscore.string"),
	path = require('path'),
	fs = require('fs'),
	spawn = require('child_process').spawn,
	utils = cb_require('utils/utils');

TDS.compile = function compile(data) {
	var home = TDS.getHome(),
		cli = TDS.getCliExecutable(home),
		deferred = Q.defer();

	if (cli === null) {
		deferred.reject(new Error("Não foi possivel encontrar o tdscli! Verifique se ele foi instalado!"));
	}
	else {
		var options = TDS.buildOptions(home, cli, 'compile', data),
			proc = spawn(options.cmd, options.args, {cwd: home});

		proc.stdout.on('data', function(data) {
			var out = data.toString('ascii').trim();
			out = out.replace(/^>>>>> Compil.*(.|[\r\n])*?>>>>\s*$/gm, "0");
			out = out.replace(/^>>>>.*(.|[\r\n])*?>>>>\s*$/gm, "");

			if (out) {
				console.log(out);
			}
		});

		proc.stderr.on('data', function(data) {
			var err = data.toString('ascii').replace(/^Warning: NLS unused message: (.*)$/gm, "").trim();

			if (err) {
				console.error(err);
			}
		});

		proc.on('close', function(code) {
			if (code !== 0) {
				deferred.reject(new Error("Tdscli process exited with code " + code));
			}
			else {
				deferred.resolve();
			}
		});
	}

	return deferred.promise;
};


TDS.getHome = function getHome() {
	var home = process.env["TDS_HOME"];

	if (home === undefined) {
		utils.fail("Variavel de ambiente 'TDS_HOME' nao definida!");
	}

	home = path.normalize(home);
	if (!_s.endsWith(home, path.sep)) {
		home += path.sep;
	}

	console.log("Usando TDS_HOME='" + home + "'");

	return home;
};

TDS.getCliExecutable = function getCliExecutable(home) {
	var files = fs.readdirSync(home);

	for (var i = 0; i < files.length; i++) {
		if (_s.startsWith(files[i], "tdscli.")) {
			return files[i];
		}
	}

	return null;
};

TDS.buildOptions = function buildOptions(home, cli, target, data) {
	var opts = {
		cmd: home + cli,
		args: [],
		opts: {
			cwd: home
		}
	};

	opts.args.push(target);

	if (data.workspace) {
		opts.args.push("-data");
		opts.args.push(data.workspace);
		opts.args.push("workspace=true");
	}

	var keys = Object.keys(data);
	var index = keys.indexOf("workspace");
	if (index > -1) {
		keys.splice(index, 1);
	}

	keys.forEach(function(key, index) {
		var value = key + "=";

		if (Array.isArray(data[key])) {
			value += data[key].join(";");
		}
		else {
			value += data[key];
		}

		opts.args.push(value);
	});

	return opts;
};

