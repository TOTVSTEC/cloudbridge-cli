'use strict';

var fs = require('fs'),
	path = require('path');

var Project = module.exports;

Project.PROJECT_FILE = 'cloudbridge.json';
Project.PROJECT_DEFAULT = {
	name: '',
	id: ''
};
Project.data = null;

Project.wrap = function wrap(appDirectory, _data) {
	return {
		get: function get(key) {
			return Project.get(_data, key);
		},
		remove: function remove(key) {
			return Project.remove(_data, key);
		},
		set: function set(key, value) {
			return Project.set(_data, key, value);
		},
		save: function save() {
			return Project.save(appDirectory, _data);
		},
		reload: function reload() {
			_data = JSON.parse(fs.readFileSync(path.join(appDirectory, Project.PROJECT_FILE)));
		},
		toString: function toString() {
			return JSON.stringify(_data);
		},
		data: function data() {
			return _data;
		}
	};
};

Project.load = function load(appDirectory) {
	if (!appDirectory) {
		//Try to grab cwd
		appDirectory = process.cwd();
	}
	var file = path.join(appDirectory, Project.PROJECT_FILE);
	var data;
	if (fs.existsSync(file)) {
		try {
			data = JSON.parse(fs.readFileSync(file));
		}
		catch (ex) {
			throw new Error('There was an error loading your cloudbridge.json file: ' + ex.message);
		}
	}
	else {
		throw new Error('Unable to locate the cloudbridge.json file. Are you in your project directory?');
	}

	return Project.wrap(appDirectory, data);
};

Project.create = function create(appDirectory, name) {
	var data = Project.PROJECT_DEFAULT;
	if (name) {
		Project.set(data, 'name', name);
	}
	// return this;
	return Project.wrap(appDirectory, data);
};

Project.save = function save(appDirectory, data) {
	if (!data) {
		console.trace();
		console.error('This should never happen!');
	}
	try {
		var filePath = path.join(appDirectory, Project.PROJECT_FILE),
			jsonData = JSON.stringify(data, null, 2);

		fs.writeFileSync(filePath, jsonData + '\n');
	}
	catch (e) {
		console.error('Unable to save settings file:', e);
	}
};

Project.get = function get(data, key) {
	if (!data) {
		return null;
	}
	if (key) {
		return data[key];
	}
	else {
		return data;
	}
};

Project.set = function set(data, key, value) {
	if (!data) {
		data = Project.PROJECT_DEFAULT;
	}
	data[key] = value;
};

Project.remove = function remove(data, key) {
	if (!data) {
		data = Project.PROJECT_DEFAULT;
	}
	delete data[key];
};
