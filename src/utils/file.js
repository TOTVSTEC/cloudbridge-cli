'use strict';

let path = require('path'),
	shelljs = require('shelljs');

function readModifiedTime(target, options) {
	options = Object.assign({}, {
		file: true,
		dir: false,
		recurse: true
	}, options);

	let flags = '-l';

	if (options.recurse)
		flags += 'R';

	if (options.file)
		flags += 'A';

	//= recurseFiles ? '-RAl' : '-l';

	return shelljs.ls(flags, target)
		.reduce((files, item, index) => {

			if ((options.file && item.isFile()) ||
				(options.dir && item.isDirectory())) {
				var name = item.name.replace(/[\/\\]+/g, path.sep);

				files[name] = item.mtime.getTime();
			}

			return files;
		}, {});
}

function diff(from, to) {
	let result = {
		modified: [],
		added: [],
		removed: []
	};

	Object.keys(to).forEach((key, index) => {
		if (from[key] === undefined) {
			result.added.push(key);
		}
		else if (from[key] !== to[key]) {
			result.modified.push(key);
		}
	});

	Object.keys(from).forEach((key, index) => {
		if (to[key] === undefined) {
			result.removed.push(key);
		}
	});

	return result;
}

function loadModifiedTime(projectDir, key) {
	var file = path.join(projectDir, 'build', 'build.json');

	if (!shelljs.test('-e', file))
		return {};

	var content = JSON.parse(shelljs.cat(file));

	return content[key] || {};
}

function saveModifiedTime(projectDir, key, value) {
	let file = path.join(projectDir, 'build', 'build.json'),
		content = {};

	if (shelljs.test('-e', file))
		content = JSON.parse(shelljs.cat(file));

	content[key] = value;

	shelljs.ShellString(JSON.stringify(content, null, 2)).to(file);
}

function savePlatformVersion(projectDir, platform) {
	let kitVersion = getProjectPlatform(projectDir, platform),
		file = path.join(projectDir, 'build', 'build.json'),
		content = {};

	if (shelljs.test('-e', file))
		content = JSON.parse(shelljs.cat(file));

	content.platform = content.platform || {};
	content.platform[platform] = kitVersion;

	shelljs.ShellString(JSON.stringify(content, null, 2)).to(file);
}

function platformChanged(projectDir, platform) {
	let projectVersion = getProjectPlatform(projectDir, platform),
		buildVersion = loadModifiedTime(projectDir, 'platform')[platform];

	if (projectVersion !== buildVersion)
		return true;

	return false;
}

function getProjectPlatform(projectDir, platform) {
	let platforms = getProjectPlatforms(projectDir);

	return platforms[platform] || "";
}

function getProjectPlatforms(projectDir) {
	var file = path.join(projectDir, 'cloudbridge.json'),
		content = {};

	if (!shelljs.test('-e', file)) {
		return {};
	}

	content = JSON.parse(shelljs.cat(file));

	return content.platform || {};
}


module.exports = {
	readModifiedTime: readModifiedTime,
	loadModifiedTime: loadModifiedTime,
	saveModifiedTime: saveModifiedTime,
	diff: diff,
	platformChanged: platformChanged,
	savePlatformVersion: savePlatformVersion
};
