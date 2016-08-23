
var TASKS = [
	{
		title: 'start',
		name: 'start',
		summary: 'Starts a new CloudBridge project in the specified PATH',
		args: {
			'[options]': 'any flags for the command',
			'<PATH>': 'directory for the new project',
			'[template]': 'Starter templates can either come from a named template, \n' +
			'(ex: tabs, sidemenu, blank),\n' +
			'a Github repo, a Codepen url, or a local directory.\n' +
			'Codepen url, ex: http://codepen.io/cloudbridge/pen/odqCz\n' +
			'Defaults to CloudBridge "tabs" starter template'
		},
		options: {
			'--appname|-a': 'Human readable name for the app (Use quotes around the name)',
			'--id|-i': 'Package name for the app config, ex: com.mycompany.myapp',
			'--list|-l': {
				title: 'List starter templates available',
				boolean: true
			},
			'--template|-t': 'Project starter template',
			'--zip-file|-z': 'URL to download zipfile for starter template'
		},
		module: 'start'
	},
	{
		title: 'platform',
		name: 'platform',
		alt: ['platforms'],
		summary: 'Add platform target for building an CloudBridge app',
		args: {
			'[options]': '',
			'<PLATFORM>': ''
		},
		options: {
			'--noresources|-r': {
				title: 'Do not add default CloudBridge icons and splash screen resources',
				boolean: true
			},
			'--nosave|-e': {
				title: 'Do not save the platform to the package.json file',
				boolean: true
			}
		},
		module: 'platform'
	},
	{
		title: 'build',
		name: 'build',
		summary: 'Locally build an CloudBridge project for a given platform',
		args: {
			'[options]': '',
			'<PLATFORM>': ''
		},
		options: {

		},
		module: 'build'
	},
	{
		title: 'run',
		name: 'run',
		summary: 'Run an CloudBridge project on a connected device',
		args: {
			'[options]': '',
			'<PLATFORM>': ''
		},
		options: {

		},
		module: 'run'
	}
];


TASKS.getTaskWithName = function getTaskWithName(name) {
	for (var i = 0; i < TASKS.length; i++) {
		var t = TASKS[i];

		if (t.name === name) {
			return t;
		}

		if (t.alt) {
			for (var j = 0; j < t.alt.length; j++) {
				var alt = t.alt[j];
				if (alt === name) {
					return t;
				}
			}
		}
	}
};

module.exports = TASKS;
