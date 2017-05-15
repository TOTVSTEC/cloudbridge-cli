'use strict';

let
	Q = require('q'),
	settings = require(__basedir + '/package.json'),
	TASKS = require('./tasks/task-list');

class CliHelp {

	static printBanner() {
		var w = function(s) {
			process.stdout.write(s.bold);
		};

		w("   ________                ______       _     __\n");
		w("  / ____/ /___  __  ______/ / __ )_____(_)___/ /___ ____ \n");
		w(" / /   / / __ \\/ / / / __  / __  / ___/ / __  / __ `/ _ \\\n");
		w("/ /___/ / /_/ / /_/ / /_/ / /_/ / /  / / /_/ / /_/ /  __/\n");
		w("\\____/_/\\____/\\__,_/\\__,_/_____/_/  /_/\\__,_/\\__, /\\___/ \n");
		w("                                            /____/\n");
		w("By TOTVS                                          v" + settings.version + "\n");
	}

	static printAvailableTasks(argv) {
		this.printBanner();

		process.stderr.write('\nUsage: cloudbridge task args\n\n=======================\n\n');

		if (process.argv.length > 2) {
			process.stderr.write((process.argv[2] + ' is not a valid task\n\n').bold.red);
		}

		process.stderr.write('Available tasks: '.bold);
		process.stderr.write('(use --help or -h for more info)\n\n');

		for (var i = 0; i < TASKS.length; i++) {
			var task = TASKS[i];
			if (task.summary) {
				var name = '   ' + task.name + '  ';
				var dots = '';
				while ((name + dots).length < 20) {
					dots += '.';
				}
				process.stderr.write(name.green.bold + dots.grey + '  ' + task.summary.bold + '\n');
			}
		}

		process.stderr.write('\n');

		return Q();
	}

	static printHelpLines() {
		CliHelp.printBanner();
		process.stderr.write('\n=======================\n');

		for (var i = 0; i < TASKS.length; i++) {
			var task = TASKS[i];
			if (task.summary) {
				CliHelp.printUsage(task);
			}
		}

		process.stderr.write('\n');

		return Q();
	}

	static printUsage(d) {
		var w = function(s) {
			process.stdout.write(s);
		};

		w('\n');

		var rightColumn = 45;
		var dots = '';
		var indent = '';
		var x, arg;

		var taskArgs = d.name;

		for (arg in d.args) {
			taskArgs += ' ' + arg;
		}

		w(taskArgs.green.bold);

		while ((taskArgs + dots).length < rightColumn + 1) {
			dots += '.';
		}

		w(' ' + dots.grey + '  ');

		if (d.summary) {
			w(d.summary.bold);
		}

		for (arg in d.args) {
			if (!d.args[arg]) continue;

			indent = '';
			w('\n');
			while (indent.length < rightColumn) {
				indent += ' ';
			}
			w((indent + '	' + arg + ' ').bold);

			var argDescs = d.args[arg].split('\n');
			var argIndent = indent + '	';

			for (x = 0; x < arg.length + 1; x++) {
				argIndent += ' ';
			}

			for (x = 0; x < argDescs.length; x++) {
				if (x === 0) {
					w(argDescs[x].bold);
				}
				else {
					w('\n' + argIndent + argDescs[x].bold);
				}
			}
		}

		indent = '';
		while (indent.length < d.name.length + 1) {
			indent += ' ';
		}

		var optIndent = indent;
		while (optIndent.length < rightColumn + 4) {
			optIndent += ' ';
		}

		for (var opt in d.options) {
			w('\n');
			dots = '';

			var optLine = indent + '[' + opt + ']  ';

			w(optLine.yellow.bold);

			if (d.options[opt]) {
				while ((dots.length + optLine.length - 2) < rightColumn) {
					dots += '.';
				}
				w(dots.grey + '  ');

				var taskOpt = d.options[opt],
					optDescs;

				if (typeof taskOpt == 'string') {
					optDescs = taskOpt.split('\n');
				}
				else {
					optDescs = taskOpt.summary.split('\n');
				}

				for (x = 0; x < optDescs.length; x++) {
					if (x === 0) {
						w(optDescs[x].bold);
					}
					else {
						w('\n' + optIndent + optDescs[x].bold);
					}
				}
			}
		}

		w('\n');
	}
}

module.exports = CliHelp;
